package slaytherelics

import "sync"

// SyncMap is a type safe version of sync.Map. While similar to sync.Map itself this should
// generally not be used by non-specialized code, it is at least strongly typed and reduces
// the number of footguns when interacting with it.
type SyncMap[KeyType any, ValueType any] sync.Map

// Load returns the value stored associated with key, if one exists. Otherwise it returns
// the default value and false.
func (s *SyncMap[KeyType, ValueType]) Load(key KeyType) (ValueType, bool) {
	valueRaw, ok := (*sync.Map)(s).Load(key)
	if !ok {
		return *(new(ValueType)), false
	}

	value, ok := valueRaw.(ValueType)
	if !ok {
		return *(new(ValueType)), false
	}

	return value, true
}

// Store stores the value and associates it with key.
func (s *SyncMap[KeyType, ValueType]) Store(key KeyType, value ValueType) {
	(*sync.Map)(s).Store(key, value)
}
