import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { KnowledgeEntryCard } from './KnowledgeEntryCard';
import type { KnowledgeEntryDto } from '../types';

const baseEntry: KnowledgeEntryDto = {
  id: 2,
  title: 'Nucor Steel gate code',
  body: 'Main gate keypad code is 4471#.',
  category: 'GATE_CODE',
  routeId: null,
  stopId: 1,
};

function renderCard(entry: KnowledgeEntryDto) {
  return render(
    <MemoryRouter>
      <KnowledgeEntryCard entry={entry} />
    </MemoryRouter>
  );
}

describe('KnowledgeEntryCard', () => {
  it('renders the title and body text', () => {
    renderCard(baseEntry);
    expect(screen.getByText('Nucor Steel gate code')).toBeInTheDocument();
    expect(screen.getByText('Main gate keypad code is 4471#.')).toBeInTheDocument();
  });

  it('renders the correct category label for the badge', () => {
    renderCard(baseEntry);
    expect(screen.getByText('Gate Code')).toBeInTheDocument();
  });

  it('renders a different category label for a different category', () => {
    renderCard({ ...baseEntry, category: 'HAZARD' });
    expect(screen.getByText('Hazard')).toBeInTheDocument();
  });

  it('links to the correct knowledge entry detail URL', () => {
    renderCard(baseEntry);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/knowledge-entries/2');
  });
});
