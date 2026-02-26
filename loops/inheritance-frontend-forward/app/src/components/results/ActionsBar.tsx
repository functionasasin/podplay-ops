/**
 * ActionsBar — Edit Input, Export JSON, Copy Narratives.
 */
import React from 'react';
import type { EngineInput, EngineOutput, HeirNarrative } from '../../types';

export interface ActionsBarProps {
  input: EngineInput;
  output: EngineOutput;
  onEditInput: () => void;
}

export function ActionsBar({ input, output, onEditInput }: ActionsBarProps) {
  // TODO: implement
  return <div data-testid="actions-bar" />;
}
