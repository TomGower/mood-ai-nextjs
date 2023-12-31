import { PromptTemplate } from 'langchain/prompts'
import { OpenAI } from 'langchain/llms/openai'
import { StructuredOutputParser } from 'langchain/output_parsers'
import { z } from 'zod'
import { Document } from 'langchain/document'
import { loadQARefineChain } from 'langchain/chains'
import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'

const parser = StructuredOutputParser.fromZodSchema(
  z.object({
    mood: z
      .string()
      .describe('the mood of the person who wrote the journal entry.'),
    summary: z.string().describe('quick summary of the entire journal entry.'),
    negative: z
      .boolean()
      .describe(
        'is the journal entry negative? E.g, does it contain negative emotions?'
      ),
    subject: z
      .string()
      .describe('a basic description of the subject of the journal entry.'),
    color: z
      .string()
      .describe(
        'a hexadecimal color code that represents the mood of the entry. Example #0101fe for blue representing happiness.'
      ),
    sentimentScore: z
      .number()
      .describe(
        'sentiment of the text and rated on a scale from -10 to 10, where -10 is extremely negative, 0 is neutral, and 10 is extremely positive.'
      ),
  })
)

const getPrompt = async (content: string) => {
  const format_instructions = parser.getFormatInstructions()

  const prompt = new PromptTemplate({
    template:
      'Analyze the following journal entry. Follow the instructions and format your response to match the format instructions, no matter what! \n{format_instructions}\n{entry}',
    inputVariables: ['entry'],
    partialVariables: { format_instructions },
  })

  const input = await prompt.format({
    entry: content,
  })

  return input
}

export const analyze = async (content: string) => {
  const input = await getPrompt(content)
  const model = new OpenAI({ temperature: 0, modelName: 'gpt-3.5-turbo' })
  const result = await model.call(input)

  try {
    return parser.parse(result)
  } catch (error) {
    console.log(error)
  }
}

type QAEntry = {
  content: string
  id: string
  createdAt: Date
}

export const qa = async (question: string, entries: QAEntry[]) => {
  const docs = entries.map((entry) => {
    return new Document({
      pageContent: entry.content,
      metadata: {
        source: entry.id,
        date: entry.createdAt,
      },
    })
  })
  const model = new OpenAI({ temperature: 0, modelName: 'gpt-3.5-turbo' })
  // chain allows you to chain multiple AI calls together
  const chain = loadQARefineChain(model)
  const embeddings = new OpenAIEmbeddings()
  const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings)
  const relevantDocs = await vectorStore.similaritySearch(question)
  const res = await chain.call({
    input_documents: relevantDocs,
    question,
  })

  return res.output_text
}
