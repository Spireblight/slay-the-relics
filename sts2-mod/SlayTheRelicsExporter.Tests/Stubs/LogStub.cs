// Minimal stub for game logging used by ModConfigBridge.
// No-ops — tests never trigger the logging code paths.

namespace MegaCrit.Sts2.Core.Logging;

internal static class Log
{
    public static void Info(string message) { }
    public static void Warn(string message) { }
    public static void Error(string message) { }
}
