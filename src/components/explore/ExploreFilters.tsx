import { useState, useEffect } from 'react';
import { useDebounce } from '../../lib/hooks/useDebounce';

interface Entity {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
  categoryName: string;
  categoryColor: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

interface ExploreFiltersProps {
  initialEntities: Entity[];
  categories: Category[];
}

export function ExploreFilters({ initialEntities, categories }: ExploreFiltersProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const debouncedSearch = useDebounce(search, 300);
  const [results, setResults] = useState<Entity[]>(initialEntities);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If it's the exact initial state, don't fetch (initialEntities are passed in)
    if (debouncedSearch === '' && selectedCategory === null) {
      setResults(initialEntities);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('q', debouncedSearch);
    if (selectedCategory) params.set('categoryName', selectedCategory);

    fetch(`/api/entities/search?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          setResults(data);
          setIsLoading(false);
        }
      })
      .catch(err => {
        console.error(err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedSearch, selectedCategory, initialEntities]);

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-grow">
          <input 
            type="text" 
            placeholder="Search all 140,000+ entities..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white text-black neo-border px-6 py-3 sm:py-4 rounded-2xl focus:outline-none focus:neo-shadow-accent neo-shadow-sm transition-all font-mono font-black placeholder:text-gray-500"
          />
        </div>
        
        <div className="flex overflow-x-auto pb-2 md:pb-0 hide-scrollbar gap-2 shrink-0 max-w-full md:max-w-xl">
          <button 
            onClick={() => setSelectedCategory(null)}
            className={`px-5 py-2 whitespace-nowrap transition-all font-mono font-black text-sm rounded-xl ${selectedCategory === null ? 'bg-black text-white neo-border-sm neo-shadow-sm' : 'bg-white text-black neo-border-sm hover:neo-shadow-sm hover:-translate-y-0.5'}`}
          >
            All Categories
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-5 py-2 whitespace-nowrap transition-all font-mono font-black text-sm rounded-xl ${selectedCategory === cat.name ? 'bg-black text-white neo-border-sm neo-shadow-sm' : 'bg-white text-black neo-border-sm hover:neo-shadow-sm hover:-translate-y-0.5'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
        {results.length === 0 ? (
          <div className="text-center py-24 text-gray-500 font-mono">
            {isLoading ? 'Searching...' : 'No entities found matching your criteria.'}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
            {results.map(entity => (
              <a 
                key={entity.id}
                href={`/entity/${entity.slug}`}
                className="flex flex-col p-4 bg-white neo-border rounded-2xl hover:-translate-y-1 hover:neo-shadow-lg transition-all duration-300 neo-shadow-sm"
              >
                <div className="text-3xl sm:text-4xl mb-2 sm:mb-4 drop-shadow-sm">{entity.emoji}</div>
                <h3 className="font-display font-black text-sm sm:text-lg mb-1 text-black">{entity.name}</h3>
                <div 
                  className="text-xs font-mono py-1 px-3 w-max mt-auto font-black neo-border-sm rounded-lg"
                  style={{ backgroundColor: entity.categoryColor || '#eee', color: '#000' }}
                >
                  {entity.categoryName}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
