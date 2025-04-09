import { DoneAction } from '~/components/actions/done';
import { IterateAction } from '~/components/actions/iterate';
import { ReasonAction } from '~/components/actions/ReasonAction';
import { SayAction } from '~/components/actions/say';
import { ScrapeLinkAction } from '~/components/actions/scrapeLink';
import { SearchPlacesAction } from '~/components/actions/searchPlaces';
import { SearchWebAction } from '~/components/actions/searchWeb';
import { UpdateInstructionsAction } from '~/components/actions/updateInstructions';

export default {
	say: SayAction,
	iterate: IterateAction,
	done: DoneAction,
	askForClarification: SayAction,
	searchWeb: SearchWebAction,
	updateInstructions: UpdateInstructionsAction,
	scrapeLink: ScrapeLinkAction,
	searchPlaces: SearchPlacesAction,
	reason: ReasonAction,
};
