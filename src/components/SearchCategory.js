import React from 'react'
import FilterGroup from './FilterGroup'
import categories from './categories'

function SearchCategory() {
    return (
        <FilterGroup
            title="Category"
            options={categories.map(({ keyword, label }) => ({ keyword, label }))}
        />
    )
}

export default SearchCategory
