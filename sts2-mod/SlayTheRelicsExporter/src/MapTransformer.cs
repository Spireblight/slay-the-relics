using System.Collections.Generic;
using System.Linq;
using MegaCrit.Sts2.Core.Map;
using SlayTheRelicsExporter.Models;

namespace SlayTheRelicsExporter;

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
        { MapPointType.Ancient, "A" },
        { MapPointType.Unassigned, "*" },
    };

    public static (List<List<MapNodeData>> mapNodes, List<List<int>> mapPath) Transform(
        ActMap map, IReadOnlyList<MapCoord> visitedCoords)
    {
        var specs = new List<MapPointSpec>();

        foreach (var point in map.GetAllMapPoints())
        {
            specs.Add(ToSpec(point));
        }

        // StartingMapPoint (Ancient at row 0) lives outside ActMap.Grid, so GetAllMapPoints() omits it.
        var startPoint = map.StartingMapPoint;
        if (startPoint != null && startPoint.coord.col >= 0 && startPoint.coord.row >= 0)
        {
            specs.Add(ToSpec(startPoint));
        }

        if (specs.Count == 0)
            return (new List<List<MapNodeData>>(), new List<List<int>>());

        var mapNodes = MapGridBuilder.Build(specs, map.GetColumnCount());

        var mapPath = visitedCoords
            .Select(c => new List<int> { c.col, c.row })
            .ToList();

        return (mapNodes, mapPath);
    }

    private static MapPointSpec ToSpec(MapPoint point)
    {
        var nodeType = TypeMap.GetValueOrDefault(point.PointType, "*");
        var parentCols = point.parents
            .Select(p => p.coord.col)
            .OrderBy(c => c)
            .ToList();
        return new MapPointSpec(point.coord.col, point.coord.row, nodeType, parentCols);
    }
}
