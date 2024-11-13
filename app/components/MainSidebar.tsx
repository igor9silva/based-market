import { Link } from '@tanstack/react-router';
import { File, Inbox, Send } from 'lucide-react';
import * as React from 'react';
import { NavUser } from '~/components/nav-user';

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from '~/components/ui/sidebar';

const menuItems = [
	{
		title: 'Inbox',
		url: '/igor',
		icon: Inbox,
	},
	{
		title: 'Drafts',
		url: '/drafts',
		icon: File,
	},
	{
		title: 'Sent',
		url: '/sent',
		icon: Send,
	},
];

const user = {
	name: 'shadcn',
	email: 'm@example.com',
	avatar: '/avatars/shadcn.jpg',
};

function MenuItem(item: (typeof menuItems)[number]) {
	const { setOpenMobile } = useSidebar();

	return (
		<SidebarMenuItem>
			<Link to={item.url} params={{ inbox: item.title }}>
				{({ isActive }) => {
					return (
						<SidebarMenuButton
							tooltip={{
								children: item.title,
								hidden: false,
							}}
							onClick={() => setOpenMobile(false)}
							isActive={isActive}
							className="px-2.5 md:px-2"
						>
							<item.icon />
							<span>{item.title}</span>
						</SidebarMenuButton>
					);
				}}
			</Link>
		</SidebarMenuItem>
	);
}

export function MainSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	//
	// TODO: allow user to choose between floating and inset
	// const variant = 'floating';
	// const width = '3rem';
	const variant = 'inset';
	const width = '2.5rem';

	return (
		<Sidebar
			variant={variant}
			collapsible="icon"
			style={{ '--sidebar-width-icon': width } as React.CSSProperties}
			{...props}
		>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent className="px-1.5 md:px-0">
						<SidebarMenu>
							{menuItems.map((item) => (
								<MenuItem key={item.title} {...item} />
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={user} />
			</SidebarFooter>
		</Sidebar>
	);
}
