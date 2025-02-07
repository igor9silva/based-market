import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { MiniKit } from '@worldcoin/minikit-js';
import { api } from 'convex/_generated/api';
import { useMutation } from 'convex/react';
import { env } from 'convex/schemas/envSchema';
import { z } from 'zod';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { useHandleSubmit } from '~/hooks/useHandleSubmit';
import { useSubmitHotkey } from '~/hooks/useSubmitHotkey';
import { cn } from '~/lib/utils';

export const Route = createFileRoute('/top-up')({
	component: RouteComponent,
});

export function RouteComponent({ className }: { className?: string }) {
	//
	const navigate = useNavigate();
	const startTopUp = useMutation(api.transactions.public.startTopUp);

	const handleSubmit = useHandleSubmit({
		schema: z.object({
			amount: z.string().min(1, 'Amount is required'),
		}),
		handler: async ({ amount }) => {
			//
			const transaction = await startTopUp({
				payload: [
					{ symbol: 'USDCE', amount },
					{ symbol: 'WLD', amount: '1' },
				],
			});

			navigate({ to: '/top-up/$id', params: { id: transaction._id } });
		},
	});

	// confirm on CMD+Enter
	const handleKeyDown = useSubmitHotkey();

	if (!MiniKit.isInstalled()) {
		//
		const openWorldApp = () => {
			location.href = `https://worldcoin.org/mini-app?app_id=${env.VITE_WLD_CLIENT_ID}&path=/top-up`;
		};

		return (
			<div className="flex flex-col gap-2">
				<p>Top Up is only available inside the World App.</p>
				<Button variant="default" onClick={openWorldApp}>
					Open World App
				</Button>
			</div>
		);
	}

	return (
		<Card className={cn('max-h-fit border-none rounded-none', className)}>
			<CardContent className="p-4">
				<form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-col gap-2">
					<div className="flex flex-col gap-0.5">
						<Input type="number" name="amount" placeholder="Amount" required defaultValue={10} />
					</div>
					<Button variant="default" type="submit">
						Top up
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
