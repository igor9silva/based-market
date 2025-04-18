import { DoneAction } from '~/components/actions/DoneAction';
import { IncreaseBudgetAction } from '~/components/actions/IncreaseBudgetAction';
import { IterateAction } from '~/components/actions/IterateAction';
import { ReasonAction } from '~/components/actions/ReasonAction';
import { RequestBudgetAction } from '~/components/actions/RequestBudgetAction';
import { SayAction } from '~/components/actions/SayAction';
import { ScrapeLinkAction } from '~/components/actions/ScrapeLinkAction';
import { SearchPlacesAction } from '~/components/actions/SearchPlacesAction';
import { SearchWebAction } from '~/components/actions/SearchWebAction';
import { UpdateInstructionsAction } from '~/components/actions/UpdateInstructionsAction';

export default {
	say: SayAction,
	instruct: IterateAction,
	requestBudget: RequestBudgetAction,
	iterate: IterateAction,
	increaseBudget: IncreaseBudgetAction,
	done: DoneAction,
	askForClarification: SayAction,
	searchWeb: SearchWebAction,
	updateInstructions: UpdateInstructionsAction,
	scrapeLink: ScrapeLinkAction,
	searchPlaces: SearchPlacesAction,
	reason: ReasonAction,
};
