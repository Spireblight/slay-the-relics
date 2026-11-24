using System;
using System.Collections.Generic;
using System.Linq;
using SlayTheRelicsExporter.Models;

namespace SlayTheRelicsExporter;

public readonly record struct MapPointSpec(int Col, int Row, string Type, IReadOnlyList<int> ParentCols);

public static class MapGridBuilder
{
    public static List<List<MapNodeData>> Build(
        IReadOnlyCollection<MapPointSpec> points,
        int minColumnCount = 0)
    {
        if (points.Count == 0)
            return new List<List<MapNodeData>>();

        var pointLookup = new Dictionary<(int col, int row), MapPointSpec>();
        int maxRow = 0;
        int maxCol = Math.Max(0, minColumnCount - 1);

        foreach (var point in points)
        {
            if (point.Col < 0 || point.Row < 0)
                continue;

            pointLookup[(point.Col, point.Row)] = point;
            if (point.Row > maxRow) maxRow = point.Row;
            if (point.Col > maxCol) maxCol = point.Col;
        }

        if (pointLookup.Count == 0)
            return new List<List<MapNodeData>>();

        var mapNodes = new List<List<MapNodeData>>(maxRow + 1);
        for (int row = 0; row <= maxRow; row++)
        {
            var rowNodes = new List<MapNodeData>(maxCol + 1);
            for (int col = 0; col <= maxCol; col++)
            {
                if (pointLookup.TryGetValue((col, row), out var point))
                {
                    rowNodes.Add(new MapNodeData
                    {
                        Type = point.Type,
                        Parents = point.ParentCols.OrderBy(c => c).ToList(),
                    });
                }
                else
                {
                    rowNodes.Add(new MapNodeData { Type = "*", Parents = new List<int>() });
                }
            }
            mapNodes.Add(rowNodes);
        }

        return mapNodes;
    }
}
