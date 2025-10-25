import { useState, useEffect, useRef, type FC } from 'react';
import { Search, ChevronDown, ChevronUp, X } from 'lucide-react';

// Simplified mock data based on the original project's structure
const MOCK_MODELS = [
    "Llama-3-8B-Instruct-q4f32_1-MLC",
    "Llama-3-8B-Instruct-q4f16_1-MLC",
    "Phi-3-mini-4k-instruct-q4f32_1-MLC",
    "Phi-3-mini-4k-instruct-q4f16_1-MLC",
    "Mistral-7B-Instruct-v0.3-q4f16_1-MLC",
    "Gemma-2-2b-it-q4f16_1-MLC"
];

// Helper to group models by their base name
const groupModels = (models: string[]) => {
    const grouped: { [key: string]: string[] } = {};
    models.forEach(model => {
        const baseName = model.split('-').slice(0, 3).join('-');
        if (!grouped[baseName]) {
            grouped[baseName] = [];
        }
        grouped[baseName].push(model);
    });
    return Object.entries(grouped);
};

interface ModelRowProps {
  baseModel: string;
  variants: string[];
  onSelectModel: (model: string) => void;
}

const ModelRow: FC<ModelRowProps> = ({ baseModel, variants, onSelectModel }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="border border-border-color rounded-lg overflow-hidden text-sm">
            <div
                className="flex justify-between items-center p-3 hover:bg-accent cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <span className="font-semibold">{baseModel}</span>
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
            {isExpanded && (
                <div className="p-2 bg-bg-main">
                    {variants.map(variant => (
                        <div
                            key={variant}
                            onClick={() => onSelectModel(variant)}
                            className="p-2 hover:bg-accent rounded-md cursor-pointer text-xs text-text-secondary"
                        >
                            {variant.split('-').slice(3).join('-')}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


interface ModelSelectProps {
  onClose: () => void;
  onSelectModel: (model: string) => void;
}

export default function ModelSelect({ onClose, onSelectModel }: ModelSelectProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const filteredModels = MOCK_MODELS.filter(m =>
        m.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const groupedAndFiltered = groupModels(filteredModels);
    
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center animate-fade-in">
            <div className="bg-bg-sidebar rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh]">
                <header className="p-4 flex items-center justify-between border-b border-border-color">
                    <h3 className="font-bold text-lg">Select a Model</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-accent">
                        <X size={20} />
                    </button>
                </header>

                <div className="p-4 border-b border-border-color">
                    <div className="relative">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search models..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-bg-input border border-border-color rounded-md p-2 pl-10 text-sm"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                    </div>
                    {/* Placeholder for family filters */}
                </div>

                <div className="p-4 flex-1 overflow-y-auto space-y-3">
                    {groupedAndFiltered.map(([baseModel, variants]) => (
                        <ModelRow 
                            key={baseModel}
                            baseModel={baseModel}
                            variants={variants}
                            onSelectModel={onSelectModel}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
