using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Godot;
using MegaCrit.Sts2.Core.DevConsole;
using MegaCrit.Sts2.Core.DevConsole.ConsoleCommands;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Entities.Players;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Nodes.Cards;

namespace ImageExporter;

public class ImageExporterConsoleCmd : AbstractConsoleCmd
{
    public override string CmdName => "imageexporter";
    public override string Args => "cards [output_path] | card <card_id> [output_path]";
    public override string Description => "Export card images as PNGs.";
    public override bool IsNetworked => false;

    public const int OutputWidth = 734;
    public const int OutputHeight = 916;

    public static readonly PackedScene CardScene = GD.Load<PackedScene>("res://scenes/cards/card.tscn");

    public override CmdResult Process(Player? issuingPlayer, string[] args)
    {
        if (args.Length == 0)
            return new CmdResult(false, "Usage: imageexporter card <card_id> [output_path] | cards [output_path]");

        var subcommand = args[0].ToLowerInvariant();

        return subcommand switch
        {
            "card" => ExportSingleCard(args),
            "cards" => ExportAllCards(args),
            _ => new CmdResult(false, $"Unknown subcommand: {subcommand}")
        };
    }

    private CmdResult ExportSingleCard(string[] args)
    {
        if (args.Length < 2)
            return new CmdResult(false, "Usage: imageexporter card <card_id> [output_path]");

        var cardId = args[1].ToUpperInvariant();
        var outputDir = args.Length > 2 ? args[2] : "user://card-images";
        var globalPath = ResolvePath(outputDir);
        Directory.CreateDirectory(globalPath);

        var card = ModelDb.AllCards.FirstOrDefault(c =>
            c.Id.Entry.Equals(cardId, StringComparison.OrdinalIgnoreCase));

        if (card == null)
            return new CmdResult(false, $"Card not found: {cardId}");

        var filename = CardIdToFilename(card.Id.Entry);
        MainFile.Logger.Info($"Exporting {card.Id.Entry} to {globalPath}/{filename}.png");

        // Use a helper node to wait for frames before capturing
        var exporter = new CardExportHelper(card, globalPath, filename, exportUpgraded: true);
        var tree = (SceneTree)Engine.GetMainLoop();
        tree.Root.AddChild(exporter);

        return new CmdResult(true, $"Exporting {card.Id.Entry} (check logs for completion)...");
    }

    private CmdResult ExportAllCards(string[] args)
    {
        var outputDir = args.Length > 1 ? args[1] : "user://card-images";
        var globalPath = ResolvePath(outputDir);
        Directory.CreateDirectory(globalPath);

        var cards = ModelDb.AllCards.ToList();
        MainFile.Logger.Info($"Exporting {cards.Count} cards to {globalPath}");

        var exporter = new BatchCardExportHelper(cards, globalPath);
        var tree = (SceneTree)Engine.GetMainLoop();
        tree.Root.AddChild(exporter);

        return new CmdResult(true, $"Exporting {cards.Count} cards (check logs for completion)...");
    }

    private static string ResolvePath(string path)
    {
        return path.StartsWith("user://") ? ProjectSettings.GlobalizePath(path) : path;
    }

    public static string CardIdToFilename(string idEntry)
    {
        return idEntry.ToLowerInvariant();
    }
}

/// <summary>
/// Exports a single card image, waiting for render frames between setup and capture.
/// </summary>
public partial class CardExportHelper : Node
{
    private readonly CardModel _card;
    private readonly string _outputDir;
    private readonly string _filename;
    private readonly bool _exportUpgraded;
    private SubViewport? _viewport;
    private NCard? _nCard;
    private int _frameWait;
    private bool _doingUpgrade;

    public CardExportHelper(CardModel card, string outputDir, string filename, bool exportUpgraded)
    {
        _card = card;
        _outputDir = outputDir;
        _filename = filename;
        _exportUpgraded = exportUpgraded;
    }

    public override void _Ready()
    {
        SetupCard(_card);
    }

    public override void _Process(double delta)
    {
        _frameWait++;
        if (_frameWait < 3) return; // wait 3 frames for full render

        CaptureAndSave();

        if (_exportUpgraded && !_doingUpgrade && _card.MaxUpgradeLevel > 0)
        {
            // Now do the upgraded version
            _doingUpgrade = true;
            _frameWait = 0;
            Cleanup();
            var upgraded = _card.ToMutable();
            upgraded.UpgradeInternal();
            upgraded.FinalizeUpgradeInternal();
            SetupCard(upgraded);
            return;
        }

        Cleanup();
        QueueFree();
    }

    private void SetupCard(CardModel card)
    {
        _viewport = new SubViewport();
        _viewport.Size = new Vector2I(ImageExporterConsoleCmd.OutputWidth, ImageExporterConsoleCmd.OutputHeight);
        _viewport.TransparentBg = true;
        _viewport.RenderTargetUpdateMode = SubViewport.UpdateMode.Always;

        _nCard = ImageExporterConsoleCmd.CardScene.Instantiate<NCard>();

        // Center card in viewport using the same offset pattern as card_intent.tscn
        float w = ImageExporterConsoleCmd.OutputWidth;
        float h = ImageExporterConsoleCmd.OutputHeight;
        _nCard.Scale = new Vector2(2f, 2f);
        _nCard.OffsetLeft = w / 2f;
        _nCard.OffsetTop = h / 2f;
        _nCard.OffsetRight = w / 2f;
        _nCard.OffsetBottom = h / 2f;

        _viewport.AddChild(_nCard);
        AddChild(_viewport);

        // Set model AFTER adding to tree so _Ready resolves child nodes first.
        // Use mutable clone so dynamic vars and descriptions resolve.
        var mutable = card.IsMutable ? card : card.ToMutable();

        _nCard.Model = mutable;
        try
        {
            _nCard.UpdateVisuals(PileType.Deck, CardPreviewMode.None);
        }
        catch (ArgumentOutOfRangeException)
        {
            // Cards with dynamic Type (e.g. MadScience) may have Type=None
            // without a runtime context. Card still renders with portrait/frame.
        }
    }

    private void CaptureAndSave()
    {
        if (_viewport == null) return;

        var suffix = _doingUpgrade ? "plusone" : "";
        var path = System.IO.Path.Combine(_outputDir, _filename + suffix + ".png");

        var image = _viewport.GetTexture().GetImage();
        var err = image.SavePng(path);
        if (err != Error.Ok)
            MainFile.Logger.Warn($"Failed to save {path}: {err}");
        else
            MainFile.Logger.Info($"Saved {path} ({image.GetWidth()}x{image.GetHeight()})");
    }

    private void Cleanup()
    {
        if (_nCard != null && IsInstanceValid(_nCard))
        {
            _viewport?.RemoveChild(_nCard);
            _nCard.QueueFree();
            _nCard = null;
        }
        if (_viewport != null && IsInstanceValid(_viewport))
        {
            RemoveChild(_viewport);
            _viewport.QueueFree();
            _viewport = null;
        }
    }
}

/// <summary>
/// Exports all cards one at a time, waiting for frames between each.
/// </summary>
public partial class BatchCardExportHelper : Node
{
    private readonly List<CardModel> _cards;
    private readonly string _outputDir;
    private int _currentIndex;
    private int _exported;
    private int _errors;
    private CardExportHelper? _current;

    public BatchCardExportHelper(List<CardModel> cards, string outputDir)
    {
        _cards = cards;
        _outputDir = outputDir;
    }

    public override void _Ready()
    {
        StartNext();
    }

    public override void _Process(double delta)
    {
        if (_current != null && IsInstanceValid(_current))
            return;

        // Previous card finished (or first call after _Ready started one)
        if (_current != null)
            _exported++;

        StartNext();
    }

    private void StartNext()
    {
        if (_currentIndex >= _cards.Count)
        {
            MainFile.Logger.Info($"Batch export complete: {_exported} exported, {_errors} errors");
            QueueFree();
            return;
        }

        var card = _cards[_currentIndex++];
        try
        {
            var filename = ImageExporterConsoleCmd.CardIdToFilename(card.Id.Entry);
            _current = new CardExportHelper(card, _outputDir, filename, exportUpgraded: true);
            AddChild(_current);
        }
        catch (Exception ex)
        {
            MainFile.Logger.Warn($"Failed to start export for {card.Id}: {ex.Message}");
            _errors++;
        }
    }
}
