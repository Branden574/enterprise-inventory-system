import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Inventory System title', () => {
  render(<App />);
  const title = screen.getByText(/Inventory System/i);
  expect(title).toBeInTheDocument();
});
