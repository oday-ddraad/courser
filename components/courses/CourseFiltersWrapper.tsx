'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import CourseFilters from './CourseFilters';

interface FilterState {
  search: string;
  category: string;
  level: string;
  minPrice: string;
  maxPrice: string;
  rating: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface CourseFiltersWrapperProps {
  initialFilters: FilterState;
  categories: string[];
}

export default function CourseFiltersWrapper({ initialFilters, categories }: CourseFiltersWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleFilterChange = (filters: FilterState) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Update or remove search param
    if (filters.search) {
      params.set('search', filters.search);
    } else {
      params.delete('search');
    }
    
    // Update or remove category param
    if (filters.category) {
      params.set('category', filters.category);
    } else {
      params.delete('category');
    }
    
    // Update or remove level param
    if (filters.level) {
      params.set('level', filters.level);
    } else {
      params.delete('level');
    }
    
    // Update or remove minPrice param
    if (filters.minPrice) {
      params.set('minPrice', filters.minPrice);
    } else {
      params.delete('minPrice');
    }
    
    // Update or remove maxPrice param
    if (filters.maxPrice) {
      params.set('maxPrice', filters.maxPrice);
    } else {
      params.delete('maxPrice');
    }
    
    // Update or remove rating param
    if (filters.rating) {
      params.set('rating', filters.rating);
    } else {
      params.delete('rating');
    }
    
    // Update sort params
    params.set('sortBy', filters.sortBy);
    params.set('sortOrder', filters.sortOrder);
    
    // Reset to page 1 when filters change
    params.delete('page');
    
    // Navigate to new URL
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <CourseFilters
      filters={initialFilters}
      onFilterChange={handleFilterChange}
      categories={categories}
    />
  );
}
