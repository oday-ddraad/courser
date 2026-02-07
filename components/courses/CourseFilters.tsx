'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Search, SlidersHorizontal, X } from 'lucide-react';

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

interface CourseFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  categories: string[];
}

export default function CourseFilters({ filters, onFilterChange, categories }: CourseFiltersProps) {
  const locale = useLocale();
  const t = useTranslations('courses.filters');
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleChange = (field: keyof FilterState, value: string) => {
    onFilterChange({
      ...filters,
      [field]: value,
    });
  };
  
  const handleReset = () => {
    onFilterChange({
      search: '',
      category: '',
      level: '',
      minPrice: '',
      maxPrice: '',
      rating: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  };
  
  const hasActiveFilters = 
    filters.category || 
    filters.level || 
    filters.minPrice || 
    filters.maxPrice || 
    filters.rating;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6">
      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={filters.search}
          onChange={(e) => handleChange('search', e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {filters.search && (
          <button
            onClick={() => handleChange('search', '')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      
      {/* Filter Toggle */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <SlidersHorizontal className="w-5 h-5" />
          <span>{isExpanded ? t('hideFilters') : t('showFilters')}</span>
        </button>
        
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
          >
            {t('resetFilters')}
          </button>
        )}
      </div>
      
      {/* Expanded Filters */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('category')}
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="">{t('allCategories')}</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          
          {/* Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('level')}
            </label>
            <select
              value={filters.level}
              onChange={(e) => handleChange('level', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="">{t('allLevels')}</option>
              <option value="beginner">{t('levels.beginner')}</option>
              <option value="intermediate">{t('levels.intermediate')}</option>
              <option value="advanced">{t('levels.advanced')}</option>
            </select>
          </div>
          
          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('priceRange')}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder={t('min')}
                value={filters.minPrice}
                onChange={(e) => handleChange('minPrice', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
              />
              <span className="text-gray-500">-</span>
              <input
                type="number"
                placeholder={t('max')}
                value={filters.maxPrice}
                onChange={(e) => handleChange('maxPrice', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('minimumRating')}
            </label>
            <select
              value={filters.rating}
              onChange={(e) => handleChange('rating', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="">{t('anyRating')}</option>
              <option value="4">4+ {t('stars')}</option>
              <option value="3">3+ {t('stars')}</option>
              <option value="2">2+ {t('stars')}</option>
              <option value="1">1+ {t('star')}</option>
            </select>
          </div>
        </div>
      )}
      
      {/* Sort Options */}
      <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <span className="text-sm text-gray-600 dark:text-gray-400">{t('sortBy')}:</span>
        <select
          value={filters.sortBy}
          onChange={(e) => handleChange('sortBy', e.target.value)}
          className="px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
        >
          <option value="createdAt">{t('newest')}</option>
          <option value="rating">{t('highestRated')}</option>
          <option value="enrollmentCount">{t('mostPopular')}</option>
          <option value="price">{t('price')}</option>
        </select>
        
        <button
          onClick={() => handleChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
          className="px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {filters.sortOrder === 'asc' ? '↑' : '↓'}
        </button>
      </div>
    </div>
  );
}
