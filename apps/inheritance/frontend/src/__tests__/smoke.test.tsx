import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from '../App'

describe('smoke', () => {
  it('renders the app without crashing', () => {
    render(<App />)
    expect(screen.getByText('Inheritance Calculator')).toBeInTheDocument()
  })

  it('React is importable and functional', () => {
    const element = <div>test</div>
    expect(element).toBeDefined()
  })
})
