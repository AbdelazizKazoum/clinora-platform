'use client'

import PasswordInputWithStrength from '@/components/PasswordInputWithStrength'
import Icon from '@/components/wrappers/Icon'
import { META_DATA } from '@/config/constants'
import { ChangeEvent, FormEvent, useState } from 'react'
import { Button, Form, FormCheck, FormControl, FormLabel } from 'react-bootstrap'
import { useAuth } from '../../hooks/use-auth'

const Forms = () => {
  const { register, loading, error } = useAuth()
  const [password, setPassword] = useState('')
  const [form, setForm] = useState({
    email: '',
    fullName: '',
  })

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await register(form.fullName, form.email, password)
  }

  return (
    <Form className="mt-4" onSubmit={handleSubmit}>
      <div className="mb-3">
        <FormLabel>
          Full Name&nbsp;
          <span className="text-danger">*</span>
        </FormLabel>
        <div className="app-search">
          <FormControl
            type="text"
            id="userName"
            name="fullName"
            placeholder={META_DATA.username}
            required
            value={form.fullName}
            onChange={handleChange}
          />
          <Icon
            icon="circle-user-round"
            className="app-search-icon text-muted"
          />
        </div>
      </div>

      <div className="mb-3">
        <FormLabel>
          Email address&nbsp;
          <span className="text-danger">*</span>
        </FormLabel>
        <div className="app-search">
          <FormControl
            type="email"
            id="userEmail"
            name="email"
            placeholder="you@example.com"
            required
            value={form.email}
            onChange={handleChange}
          />
          <Icon icon="mail" className="app-search-icon text-muted" />
        </div>
      </div>

      <div className="mb-3" data-password="bar">
        <FormLabel>
          Password&nbsp;
          <span className="text-danger">*</span>
        </FormLabel>
        <PasswordInputWithStrength
          name="password"
          password={password}
          setPassword={setPassword}
          placeholder="********"
          inputClassName="form-control"
          showIcon
        />
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <FormCheck>
          <FormCheck.Input
            className="form-check-input-light fs-14"
            type="checkbox"
            id="termAndPolicy"
            required
          />
          <FormCheck.Label htmlFor="termAndPolicy">
            Agree the Terms &amp; Policy
          </FormCheck.Label>
        </FormCheck>
      </div>

      {error && <p className="text-danger">{error}</p>}

      <div className="d-grid">
        <Button
          variant="primary"
          type="submit"
          className="fw-semibold py-2"
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </div>
    </Form>
  )
}

export default Forms
