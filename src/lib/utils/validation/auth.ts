import * as v from 'valibot'

export const Email = v.pipe(
	v.string('Email is required'),
	v.trim(),
	v.email('Please enter a valid email'),
	v.maxLength(255, 'Email is too long'),
)

export const Password = v.pipe(
	v.string('Password is required'),
	v.minLength(8, 'Password must be at least 8 characters'),
	v.maxLength(128, 'Password is too long'),
)

export const RegisterSchema = v.pipe(
	v.object({
		email: Email,
		password: Password,
		confirmPassword: v.string('Please confirm your password'),
	}),
	v.forward(
		v.check(
			input => input.password === input.confirmPassword,
			'Passwords do not match',
		),
		['confirmPassword'],
	),
)

export const LoginSchema = v.object({
	email: Email,
	password: v.string('Password is required'),
})

export type RegisterInput = v.InferOutput<typeof RegisterSchema>
export type LoginInput = v.InferOutput<typeof LoginSchema>
