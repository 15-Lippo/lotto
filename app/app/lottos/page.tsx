import styles from "./page.module.css";
import ActiveLottoCard from "./ActiveLottoCard";
import ExpiredLottoCard from "./ExpiredLottoCard";
import CompleteLottoCard from "./CompleteLottoCard";
import { getContractWithProvider } from "./contractHandler";

export const dynamic = 'auto',
  dynamicParams = true,
  revalidate = 0,
  fetchCache = 'auto',
  runtime = 'nodejs',
  preferredRegion = 'auto'

export interface Game {
	id: number,
	capacity: number,
	ticketPrice: string,
	pool: string[],
	expiration: number,
	prizeDistributed: boolean
}

async function getGames(chainId: string) {
	const contract = await getContractWithProvider(chainId);
	const games: Game[] = (await contract.getGames()).map(
		(game: any, index: number) => ({
			id: index,
			capacity: game[0].toNumber(),
			ticketPrice: game[1].toString(),
			pool: game[2],
			expiration: game[3].toNumber(),
			prizeDistributed: game[4]
		})
	);

	const activeGames = games.filter(game =>
		game.pool.length < game.capacity 
		&& (game.expiration === 0 || game.expiration > Date.now()/1000)
	);
	const expiredGames = games.filter(game =>
		game.pool.length < game.capacity 
		&& (game.expiration !== 0 && game.expiration <= Date.now()/1000)
		&& !game.prizeDistributed
	);
	const completeGames = games.filter(game =>
		game.pool.length === game.capacity || game.prizeDistributed
	);

	return { activeGames, expiredGames, completeGames };
}

interface Props {
	searchParams?: { chainId?: string }
}

export default async function LottosPage({ searchParams }: Props) {
	const chainId = searchParams?.chainId!;
	const { activeGames, expiredGames, completeGames } = await getGames(chainId);

	return (
		<div>
			<div className={styles.grid}>
				{activeGames.map(game => {
					return <ActiveLottoCard key={`${chainId}:${game.id}`} {...game} />
				})}
			</div>
			<div className={styles.grid}>
				{expiredGames.map(game => {
					return <ExpiredLottoCard key={`${chainId}:${game.id}`} {...game} />
				})}
			</div>
			<div className={styles.grid}>
				{completeGames.map(game => {
					return <CompleteLottoCard key={`${chainId}:${game.id}`} {...game} />
				})}
			</div>
		</div>
	)
}