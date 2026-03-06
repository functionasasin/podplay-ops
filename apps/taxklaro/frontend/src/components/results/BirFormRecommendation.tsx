import type { FormType } from '@/types/common';
import type { FormOutputUnion } from '@/types/engine-output';

interface BirFormRecommendationProps {
  formType: FormType;
  formOutput: FormOutputUnion;
  requiredAttachments: string[];
}

export function BirFormRecommendation(_props: BirFormRecommendationProps) {
  return null;
}

export default BirFormRecommendation;
