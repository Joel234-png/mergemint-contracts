import React, { useEffect, useRef, useState } from 'react';
import { BountyStatus } from '../types';
import { BountySortField, SortOrder } from '../lib/api';

/**
 * Filter and sort state values for the bounty listing.
 */
export interface BountyFilterValues {
  status: BountyStatus | 'all';
  tag: string;
  q: string;
  sort: BountySortField;
  order: SortOrder;
}

/**
 * Props accepted by the BountyFilters component.
 */
export interface BountyFiltersProps {
  status: BountyStatus | 'all';
  tag: string;
  q: string;
  sort: BountySortField;
  order: SortOrder;
  onStatusChange: (status: BountyStatus | 'all') => void;
  onTagChange: (tag: string) => void;
  onQueryChange: (q: string) => void;
  onSortChange: (sort: BountySortField) => void;
  onOrderChange: (order: SortOrder) => void;
  onReset: () => void;
}

const STATUS_OPTIONS: Array<BountyStatus | 'all'> = [
  'all',
  'open',
  'claimed',
  'disputed',
  'completed',
  'cancelled',
];

const SORT_OPTIONS: Array<{ value: BountySortField; label: string }> = [
  { value: 'created', label: 'Date created' },
  { value: 'reward', label: 'Reward' },
  { value: 'deadline', label: 'Deadline' },
];

const ORDER_OPTIONS: Array<{ value: SortOrder; label: string }> = [
  { value: 'desc', label: 'Descending' },
  { value: 'asc', label: 'Ascending' },
];

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Renders filter controls for bounty keyword search, status, tag search, and sort order.
 *
 * @param props Configuration and callbacks for filter controls.
 * @returns JSX element containing the interactive filter controls.
 */
export function BountyFilters({
  status,
  tag,
  q,
  sort,
  order,
  onStatusChange,
  onTagChange,
  onQueryChange,
  onSortChange,
  onOrderChange,
  onReset,
}: BountyFiltersProps): React.JSX.Element {
  const [searchValue, setSearchValue] = useState(q);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the local input in sync when the query is reset or changed externally.
  useEffect(() => {
    setSearchValue(q);
  }, [q]);

  // Clear any pending debounce on unmount.
  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      onQueryChange(value);
    }, SEARCH_DEBOUNCE_MS);
  };

  const handleClearSearch = () => {
    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    setSearchValue('');
    onQueryChange('');
  };

  return (
    <div className="bounty-filters" role="region" aria-label="Bounty filters and sorting">
      <div className="bounty-filters__group bounty-filters__search">
        <label className="bounty-filters__label" htmlFor="bounty-search-input">
          Search
        </label>
        <div className="bounty-filters__search-field">
          <input
            id="bounty-search-input"
            type="search"
            className="bounty-filters__input bounty-filters__search-input"
            placeholder="Search bounties..."
            value={searchValue}
            onChange={(event) => handleSearchChange(event.target.value)}
          />
          {searchValue !== '' && (
            <button
              type="button"
              className="bounty-filters__clear-button"
              aria-label="Clear search"
              onClick={handleClearSearch}
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="bounty-filters__group bounty-filters__status">
        <span className="bounty-filters__label" id="status-filter-label">
          Status
        </span>
        <div
          className="bounty-filters__status-options"
          role="group"
          aria-labelledby="status-filter-label"
        >
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={`bounty-filters__button ${
                status === option ? 'bounty-filters__button--active' : ''
              }`}
              aria-pressed={status === option}
              onClick={() => onStatusChange(option)}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bounty-filters__group bounty-filters__tag">
        <label className="bounty-filters__label" htmlFor="tag-filter-input">
          Tag
        </label>
        <input
          id="tag-filter-input"
          type="text"
          className="bounty-filters__input"
          placeholder="Filter by tag..."
          value={tag}
          onChange={(event) => onTagChange(event.target.value)}
        />
      </div>

      <div className="bounty-filters__group bounty-filters__sort">
        <label className="bounty-filters__label" htmlFor="sort-field-select">
          Sort by
        </label>
        <select
          id="sort-field-select"
          className="bounty-filters__select"
          value={sort}
          onChange={(event) => onSortChange(event.target.value as BountySortField)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bounty-filters__group bounty-filters__order">
        <label className="bounty-filters__label" htmlFor="sort-order-select">
          Order
        </label>
        <select
          id="sort-order-select"
          className="bounty-filters__select"
          value={order}
          onChange={(event) => onOrderChange(event.target.value as SortOrder)}
        >
          {ORDER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bounty-filters__group bounty-filters__actions">
        <button
          type="button"
          className="bounty-filters__reset-button"
          onClick={onReset}
        >
          Reset filters
        </button>
      </div>
    </div>
  );
}
