using System;

namespace Godot;

internal class Engine
{
    public static object GetMainLoop() => new SceneTree();
}

internal class SceneTree
{
    #pragma warning disable CS0067 // event never used in tests
    public event Action? ProcessFrame;
    public event Action<Node>? NodeAdded;
    #pragma warning restore CS0067
}

internal class Node
{
    public string Name { get; set; } = "";
}

internal class Control : Node
{
    public enum SizeFlags { ExpandFill, ShrinkEnd }
    public SizeFlags SizeFlagsHorizontal { get; set; }
    public void AddThemeColorOverride(string name, Color color) { }
    public void AddThemeFontSizeOverride(string name, int size) { }
    public Node[] GetChildren() => Array.Empty<Node>();
    public void AddChild(Node node) { }
}

internal class Label : Control
{
    public string Text { get; set; } = "";
    public VerticalAlignment VerticalAlignment { get; set; }
}

internal class Button : Control
{
    public string Text { get; set; } = "";
}

internal class HBoxContainer : Control { }
internal class VBoxContainer : Control { }

internal enum VerticalAlignment { Center }

internal struct Color
{
    public float R, G, B, A;
    public Color(float r, float g, float b) { R = r; G = g; B = b; A = 1; }
}

internal class GodotObject
{
    public static bool IsInstanceValid(object? obj) => obj != null;
}

internal static class Callable
{
    public static CallableHandle From(Action a) => new(a);
    public struct CallableHandle
    {
        private readonly Action _a;
        public CallableHandle(Action a) => _a = a;
        public void CallDeferred() { }
    }
}
