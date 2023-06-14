import HistoryChart from '@/components/HistoryChart'
import { getUserByClerkId } from '@/utils/auth'
import { prisma } from '@/utils/db'

const getData = async () => {
  const user = await getUserByClerkId()
  const analyses = await prisma.analysis.findMany({
    where: {
      userId: user.id,
    },
  })

  const sum = analyses.reduce((acc, curr) => acc + curr.sentimentScore, 0)
  const average = Math.ceil(sum / analyses.length)
  return { analyses, average }
}

const History = async () => {
  const { analyses, average } = await getData()

  return (
    <div className="w-full h-full">
      <div>{`Average sentiment: ${average}`}</div>
      <div className="w-full h-full">
        <HistoryChart data={analyses} />
      </div>
    </div>
  )
}

export default History
