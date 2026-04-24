type StateMachineDefinition<State extends PropertyKey, Tr extends PropertyKey> = {
    initialState: State,
    onStateChange?(state: State): void
} & Record<State, {
    onEnter?: Action,
    onExit?: Action,
    effect?: Action
    transitions: Transitions<State, Tr>
}>

type Transitions<State extends PropertyKey, T extends PropertyKey> = Partial<Record<T, {
    target: State
    action?: Action
}
>>

type Action = () => void | Promise<void>
interface Machine<State, Events> {
    value: State,
    prevState?: State,
    transition(event: Events): Promise<State>,
}

export function createMachine<State extends PropertyKey, Events extends PropertyKey>(stateMachineDefinition: StateMachineDefinition<State, Events>): Machine<State, Events> {
    const machine: Machine<State, Events> = {
        value: stateMachineDefinition.initialState,
        prevState: undefined,
        async transition(event: Events) {
            const currentStateDefinition = stateMachineDefinition[machine.value]
            const destinationTransition = currentStateDefinition.transitions[event]
            if (!destinationTransition) {
                throw new Error(`У состояния ${machine.value.toString()} нет события ${event.toString()}`)
            }

            const destinationState = destinationTransition.target
            const destinationStateDefinition =
                stateMachineDefinition[destinationState]

            await currentStateDefinition.onExit?.()
            stateMachineDefinition.onStateChange?.(destinationState);
            await destinationStateDefinition.onEnter?.()
            await destinationTransition.action?.()

            machine.prevState = machine.value
            machine.value = destinationState

            await destinationStateDefinition.effect?.()

            return machine.value
        },
    }

    stateMachineDefinition.onStateChange?.(machine.value);
    stateMachineDefinition[machine.value].onEnter?.();
    return machine
}