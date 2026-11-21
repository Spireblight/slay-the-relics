package errors

type AuthError struct {
	Err error
}

func (s *AuthError) Error() string {
	return s.Err.Error()
}
func (s *AuthError) Unwrap() error { return s.Err }
