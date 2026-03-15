using System.Collections.Generic;
using System.Linq;
using MegaCrit.Sts2.Core.Map;
using SlayTheRelicsExporter.Models;

namespace SlayTheRelicsExporter;

/// <summary>
/// Converts STS2 coordinate-grid map into STS1's column-indexed mapNodes/mapPath format.
/// STS2: MapPoint with coord {col, row}, PointType enum, parents/Children sets
/// STS1: mapNodes[row][col] = {type: "M", parents: [colIndices]}, mapPath = [[col, row], ...]
/// </summary>
public static class MapTransformer
{
    private static readonly Dictionary<MapPointType, string> TypeMap = new()
    {
        { MapPointType.Monster, "M" },
        { MapPointType.Elite, "E" },
        { MapPointType.Shop, "$" },
        { MapPointType.Unknown, "?" },
        { MapPointType.RestSite, "R" },
        { MapPointType.Treasure, "T" },
        { MapPointType.Boss, "M" },
        { MapPointType.Ancient, "?" },
        { MapPointType.Unassigned, "*" },
    };

    public static (List<List<MapNodeData>> mapNodes, List<List<int>> mapPath) Transform(
        ActMap map, IReadOnlyList<MapCoord> visitedCoords)
    {
        var allPoints = map.GetAllMapPoints().ToList();
        if (allPoints.Count == 0)
            return (new List<List<MapNodeData>>(), new List<List<int>>());

        // Find grid dimensions
        int maxRow = allPoints.Max(p => p.coord.row);
        int maxCol = allPoints.Max(p => p.coord.col);

        // Build lookup: (col, row) → MapPoint
        var pointLookup = new Dictionary<(int col, int row), MapPoint>();
        foreach (var point in allPoints)
        {
            pointLookup[(point.coord.col, point.coord.row)] = point;
        }

        // Build mapNodes[row][col]
        var mapNodes = new List<List<MapNodeData>>();
        for (int row = 0; row <= maxRow; row++)
        {
            var rowNodes = new List<MapNodeData>();
            for (int col = 0; col <= maxCol; col++)
            {
                if (pointLookup.TryGetValue((col, row), out var point))
                {
                    var sts1Type = TypeMap.GetValueOrDefault(point.PointType, "*");
                    // MapPoint already has parents — extract their col indices
                    var parentCols = point.parents
                        .Select(p => p.coord.col)
                        .OrderBy(c => c)
                        .ToList();

                    rowNodes.Add(new MapNodeData
                    {
                        Type = sts1Type,
                        Parents = parentCols,
                    });
                }
                else
                {
                    rowNodes.Add(new MapNodeData { Type = "*", Parents = new List<int>() });
                }
            }
            mapNodes.Add(rowNodes);
        }

        // Build mapPath from visited coordinates
        var mapPath = visitedCoords
            .Select(c => new List<int> { c.col, c.row })
            .ToList();

        return (mapNodes, mapPath);
    }
}
