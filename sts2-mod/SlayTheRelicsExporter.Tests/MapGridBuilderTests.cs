using System.Collections.Generic;
using SlayTheRelicsExporter;
using Xunit;

namespace SlayTheRelicsExporter.Tests;

public class MapGridBuilderTests
{
    [Fact]
    public void IncludesStartingAncientNodeAtRowZero()
    {
        var points = new List<MapPointSpec>
        {
            new(3, 0, "A", new List<int>()),
            new(2, 1, "M", new List<int> { 3 }),
            new(4, 1, "M", new List<int> { 3 }),
            new(3, 2, "R", new List<int> { 4, 2 }),
        };

        var grid = MapGridBuilder.Build(points, minColumnCount: 7);

        Assert.Equal(3, grid.Count);
        Assert.All(grid, row => Assert.Equal(7, row.Count));

        Assert.Equal("A", grid[0][3].Type);
        Assert.Empty(grid[0][3].Parents);
        Assert.Equal("*", grid[0][0].Type);
        Assert.Equal("*", grid[0][6].Type);

        Assert.Equal("M", grid[1][2].Type);
        Assert.Equal(new List<int> { 3 }, grid[1][2].Parents);

        Assert.Equal(new List<int> { 2, 4 }, grid[2][3].Parents);
    }

    [Fact]
    public void PreservesGridWidthForSingleColumnMaps()
    {
        var points = new List<MapPointSpec>
        {
            new(3, 0, "A", new List<int>()),
            new(3, 1, "M", new List<int> { 3 }),
        };

        var grid = MapGridBuilder.Build(points, minColumnCount: 7);

        Assert.Equal(2, grid.Count);
        Assert.Equal(7, grid[0].Count);
        Assert.Equal("A", grid[0][3].Type);
        Assert.Equal("M", grid[1][3].Type);
    }

    [Fact]
    public void ReturnsEmptyForEmptyPoints()
    {
        var grid = MapGridBuilder.Build(new List<MapPointSpec>(), minColumnCount: 7);
        Assert.Empty(grid);
    }
}
