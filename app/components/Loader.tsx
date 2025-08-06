import React from 'react'

function Loader() {
  return (
    <div className="flex items-center justify-center h-screen absolute">
    <div className=" flex flex-col bg-white  shadow-sm rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:shadow-neutral-700/70">
  <div className="flex flex-auto flex-col justify-center items-center p-4 md:p-5">
    <div className="flex justify-center">
      <div className="animate-spin inline-block size-6 border-[3px] border-current border-t-transparent text-[#C29307] rounded-full dark:text-white" role="status" aria-label="loading">
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  </div>
</div>
</div>
  )
}

export default Loader