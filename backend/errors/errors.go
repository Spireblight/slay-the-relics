package errors

type Timeout struct {
	Err error
}

func (s *Timeout) Error() string {
	return s.Err.Error()
}
func (s *Timeout) Unwrap() error { return s.Err }

type AuthError struct {
	Err error
}

func (s *AuthError) Error() string {
	return s.Err.Error()
}
func (s *AuthError) Unwrap() error { return s.Err }
