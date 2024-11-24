import { Link } from '@tanstack/react-router';
import { AtSign, File, MoreHorizontal, Reply, Share2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { ScrollArea } from '~/components/ui/scroll-area';

interface Activity {
	id: string;
	type: 'file' | 'message' | 'mention' | 'assignment' | 'review';
	author: {
		name: string;
		avatar: string;
		initials: string;
	};
	content: string;
	timestamp: string;
	metadata?: {
		location?: string;
		time?: string;
		participants?: Array<{
			initials: string;
			avatar: string;
		}>;
		fileType?: string;
		threadCount?: number;
	};
}

export function ChatHistory() {
	const activities: Activity[] = [
		{
			id: '1',
			type: 'file',
			author: {
				name: 'Steve Mathew',
				avatar: '/placeholder-user.jpg',
				initials: 'SM',
			},
			content: 'Added file_documents.csv',
			timestamp: '2 days ago',
		},
		{
			id: '2',
			type: 'review',
			author: {
				name: 'Design Team',
				avatar: '/placeholder-user.jpg',
				initials: 'DT',
			},
			content: 'Design Review with Timeless',
			timestamp: '2 days ago',
			metadata: {
				location: 'Mumbai, Maharashtra',
				time: '10:00 - 11:00 AM',
				participants: [
					{ initials: 'B', avatar: '/placeholder-user.jpg' },
					{ initials: 'E', avatar: '/placeholder-user.jpg' },
				],
			},
		},
		{
			id: '3',
			type: 'message',
			author: {
				name: 'Meseeks',
				avatar: '/placeholder-user.jpg',
				initials: 'AI',
			},
			content:
				'Just checking in to see if I can help your team in anyway. We shipped out a bunch of exciting new updates (such as Timeless links to share with anyone outside your org) and you can find more details here.',
			timestamp: '4 days ago',
			metadata: {
				threadCount: 4,
			},
		},
		{
			id: '4',
			type: 'mention',
			author: {
				name: 'Melissa Pinto',
				avatar: '/placeholder-user.jpg',
				initials: 'MP',
			},
			content: 'Mentioned you in a comment in Item 698744',
			timestamp: '1 week ago',
		},
	];

	return (
		<div className="w-full max-w-2xl mx-auto">
			<ScrollArea className="h-[600px] rounded-md border p-4">
				<div className="space-y-6">
					{activities.map((activity) => (
						<div key={activity.id} className="flex gap-4">
							<Avatar className="w-8 h-8">
								<AvatarImage src={activity.author.avatar} />
								<AvatarFallback>{activity.author.initials}</AvatarFallback>
							</Avatar>
							<div className="flex-1 space-y-1">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Link to="/" className="font-medium hover:underline">
											{activity.author.name}
										</Link>
										{activity.type === 'file' && (
											<Badge variant="secondary" className="rounded-sm">
												<File className="w-3 h-3 mr-1" />
												Added
											</Badge>
										)}
										<span className="text-sm text-muted-foreground">{activity.timestamp}</span>
									</div>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost" size="icon" className="h-8 w-8">
												<MoreHorizontal className="h-4 w-4" />
												<span className="sr-only">More options</span>
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem>
												<Share2 className="w-4 h-4 mr-2" />
												Share
											</DropdownMenuItem>
											<DropdownMenuItem>
												<Reply className="w-4 h-4 mr-2" />
												Reply
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
								<p className="text-sm">{activity.content}</p>
								{activity.metadata?.location && (
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<span>{activity.metadata.time}</span>
										<span>{activity.metadata.location}</span>
									</div>
								)}
								{activity.metadata?.participants && (
									<div className="flex items-center gap-2 mt-2">
										<div className="flex -space-x-2">
											{activity.metadata.participants.map((participant, i) => (
												<Avatar key={i} className="w-6 h-6 border-2 border-background">
													<AvatarImage src={participant.avatar} />
													<AvatarFallback>{participant.initials}</AvatarFallback>
												</Avatar>
											))}
										</div>
										<span className="text-sm text-muted-foreground">and 4 others</span>
									</div>
								)}
								{activity.metadata?.threadCount && (
									<Button variant="ghost" size="sm" className="text-muted-foreground">
										View {activity.metadata.threadCount} more threads from this week
									</Button>
								)}
							</div>
						</div>
					))}
					<div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 border-t">
						<AtSign className="w-4 h-4" />
						Add to this activity by mailing to 744nf81j281scj-frappe@erpnext.com
					</div>
				</div>
			</ScrollArea>
		</div>
	);
}
