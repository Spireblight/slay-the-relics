package models

type User struct {
	Login string `json:"login"`
	ID    string `json:"id"`

	Hash string `json:"hash"`
}
