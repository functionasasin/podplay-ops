import { render } from '@testing-library/react'
import App from '../App'

test('App mounts without crashing', () => {
  const { container } = render(<App />)
  expect(container).toBeTruthy()
})
