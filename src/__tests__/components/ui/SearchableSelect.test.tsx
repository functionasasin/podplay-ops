import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { SearchableSelect } from '@/components/ui/SearchableSelect';

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

const OPTIONS = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
];

describe('SearchableSelect', () => {
  it('SS-01: renders with placeholder text when no value is selected', () => {
    render(
      <SearchableSelect
        options={OPTIONS}
        value=""
        onChange={vi.fn()}
        placeholder="Pick a fruit"
      />,
    );
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.placeholder).toBe('Pick a fruit');
  });

  it('SS-02: shows all options when input is focused', () => {
    render(<SearchableSelect options={OPTIONS} value="" onChange={vi.fn()} />);
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    expect(screen.getByRole('listbox')).toBeTruthy();
    expect(screen.getByText('Apple')).toBeTruthy();
    expect(screen.getByText('Banana')).toBeTruthy();
    expect(screen.getByText('Cherry')).toBeTruthy();
  });

  it('SS-03: filters options as user types', () => {
    render(<SearchableSelect options={OPTIONS} value="" onChange={vi.fn()} />);
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'ban' } });
    expect(screen.getByText('Banana')).toBeTruthy();
    expect(screen.queryByText('Apple')).toBeNull();
    expect(screen.queryByText('Cherry')).toBeNull();
  });

  it('SS-04: calls onChange when option is clicked', () => {
    const onChange = vi.fn();
    render(<SearchableSelect options={OPTIONS} value="" onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    const option = screen.getByText('Banana');
    fireEvent.mouseDown(option);
    expect(onChange).toHaveBeenCalledWith('banana');
  });

  it('SS-05: arrow down highlights next option, Enter selects it', () => {
    const onChange = vi.fn();
    render(<SearchableSelect options={OPTIONS} value="" onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    // Arrow down once → highlights index 0 (Apple)
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    // Arrow down again → highlights index 1 (Banana)
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    // Enter selects Banana
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('banana');
  });

  it('SS-06: Escape closes the dropdown', () => {
    render(<SearchableSelect options={OPTIONS} value="" onChange={vi.fn()} />);
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    expect(screen.getByRole('listbox')).toBeTruthy();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('SS-07: disabled prop prevents interaction', () => {
    const onChange = vi.fn();
    render(<SearchableSelect options={OPTIONS} value="" onChange={onChange} disabled />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.disabled).toBe(true);
    fireEvent.focus(input);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('SS-08: shows selected option label in input when closed', () => {
    render(<SearchableSelect options={OPTIONS} value="cherry" onChange={vi.fn()} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('Cherry');
  });
});
