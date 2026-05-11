/* eslint-disable no-unused-vars */
export class Tournament {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.participants = [];
        this.isActive = false;
        this.winner = null;
    }

    init(teamIds) {
        this.participants = [...teamIds];
        this.isActive = true;
    }

    advanceWeek(engine, week) {
        // Override in subclasses
        return null;
    }
}
