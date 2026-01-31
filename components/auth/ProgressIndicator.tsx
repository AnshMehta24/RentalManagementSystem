interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
}

export default function ProgressIndicator({ 
  currentStep, 
  totalSteps,
  stepLabels = [] 
}: ProgressIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNumber = index + 1;
        const isActive = currentStep >= stepNumber;
        const label = stepLabels[index];

        return (
          <div key={stepNumber} className="flex items-center">
            <div className={`flex items-center ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                {stepNumber}
              </div>
              {label && (
                <span className="ml-2 text-sm font-medium hidden sm:inline">{label}</span>
              )}
            </div>
            {stepNumber < totalSteps && (
              <div className={`w-12 h-0.5 ${currentStep > stepNumber ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            )}
          </div>
        );
      })}
    </div>
  );
}