import { BiSearch } from "react-icons/bi"; 
import { Input } from '@/components/ui/input'
import React from 'react'

function SearchBar() {
  return (
    <div className='w-[60%] flex items-center px-3 border rounded-md'>
        <BiSearch />
        <input type="search" className='h-full p-3 w-full border-none outline-none' placeholder='Search within Dashboard'/>
    </div>
  )
}

export default SearchBar