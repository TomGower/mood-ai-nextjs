'use client'

import { askQuestion } from '@/utils/api'
import { ChangeEvent, FormEvent, useState } from 'react'

const Question = () => {
  const [value, setValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState('')
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
    // doing stuff was moved to handleSubmit
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const answer = await askQuestion(value)
    setResponse(answer)
    setValue('')
    setIsLoading(false)
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Ask a question"
          value={value}
          onChange={onChange}
          className="border border-black/20 px-4 py-2 text-lg rounded-lg"
        ></input>
        <button
          disabled={isLoading}
          type="submit"
          className="bg-blue-400 px-4 py-2 rounded-lg text-lg"
        >
          Ask
        </button>
      </form>
      {isLoading && <div>...loading</div>}
      {response && <div>{response}</div>}
    </div>
  )
}

export default Question
