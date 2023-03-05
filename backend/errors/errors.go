package errors

type Timeout struct {
	Err error
}

func (s *Timeout) Error() string {
	return s.Err.Error()
}

type AuthError struct {
	Err error
}

func (s *AuthError) Error() string {
	return s.Err.Error()
}
