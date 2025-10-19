import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ReportsPage from '../ReportsPage';

// Mock the report subcomponents to simplify the test and avoid rendering Recharts
jest.mock('../rapports/RapportsVentes', () => () => <div><h2>Rapports - Ventes</h2></div>);
jest.mock('../rapports/RapportsDepenses', () => () => <div><h2>Rapports - Dépenses</h2></div>);
jest.mock('../rapports/RapportsTresorerie', () => () => <div><h2>Rapports - Trésorerie</h2></div>);
jest.mock('../rapports/RapportsStocks', () => () => <div><h2>Rapports - Stocks</h2></div>);

describe('ReportsPage tabs', () => {
  test('renders tabs and switches content', () => {
    render(<ReportsPage />);

    // check tabs exist
    expect(screen.getByRole('button', { name: /Ventes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Dépenses/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Trésorerie/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Stocks/i })).toBeInTheDocument();

    // default active should be Ventes
    expect(screen.getByText(/Rapports - Ventes/i)).toBeInTheDocument();

    // click Depenses
    fireEvent.click(screen.getByRole('button', { name: /Dépenses/i }));
    expect(screen.getByText(/Rapports - Dépenses/i)).toBeInTheDocument();

    // click Trésorerie
    fireEvent.click(screen.getByRole('button', { name: /Trésorerie/i }));
    expect(screen.getByText(/Rapports - Trésorerie/i)).toBeInTheDocument();

    // click Stocks
    fireEvent.click(screen.getByRole('button', { name: /Stocks/i }));
    expect(screen.getByText(/Rapports - Stocks/i)).toBeInTheDocument();
  });
});
