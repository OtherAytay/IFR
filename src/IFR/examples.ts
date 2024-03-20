import { IFR, Stage, Event, Task, Outcome, Variable, IFRState, EventGroup, Condition } from './ifr';

export function SP() {
    const ifr = new IFR("Sissy Prostitute")

    // Variables
    var numPleased = new Variable("Customers Pleased", Variable.NUM, 0);
    var totalMoney = new Variable("Money", Variable.NUM, 0);
    var totalEarnings = new Variable("Total Earnings", Variable.NUM, 0);
    var freedomGoal = new Variable("Freedom Goal", Variable.NUM, 3000);
    var sessionGoal = new Variable("Session Goal", Variable.NUM, 300);
    var sessionEarned = new Variable("Session Earnings", Variable.NUM, 0);
    ifr.addVariable([numPleased, totalMoney, totalEarnings, freedomGoal, sessionGoal, sessionEarned])

    // Stages
    var setup = new Stage("Start Session", "Set up options", "", 5, 5);
    var please = new Stage("Work", "Please the Customer", "", 1, 5);
    var end = new Stage("Finish Session", "Get what you deserve", "", 1, 5);
    ifr.addStage(setup)
    ifr.addStage(please)
    ifr.addStage(end)

    // Client Desires
    var desires = new Event("Client Desires", "", 10, true);
    var desiresTasks = [
        { min: 1, max: 1, task: new Task("Blowie", "", "Blowjob") },
        { min: 2, max: 2, task: new Task("Quickie", "", "Penetration") },
        { min: 3, max: 3, task: new Task("Throatie", "", "Deepthroat") },
        { min: 4, max: 4, task: new Task("Average Joe", "", "Blowjob + Penetration") },
        { min: 5, max: 5, task: new Task("Penetrator", "", "Deepthroat + Penetration") },
        { min: 6, max: 6, task: new Task("Well-Rounded William", "", "Blowjob + Deepthroat + Penetration + Kink") },
        { min: 7, max: 7, task: new Task("Throat Lover", "", "3x Deepthroat + Kink") },
        { min: 8, max: 8, task: new Task("Heavy Penetrator", "", "2x Deepthroat + Penetration + Kink") },
        { min: 9, max: 9, task: new Task("Slobbered-Knob Steve", "", "2x Blowjob + Deepthroat + Penetration + Kink") },
        { min: 10, max: 10, task: new Task("Penetration Enjoyer", "", "Blowjob + Deepthroat + 2x Penetration + Kink") },
    ]

    // Accessories
    var accessorize = new Event("Accessorize", "", 10, true);
    var accessorizeEarnings = new Variable("Accesorize Earnings", Variable.NUM, 0)
    var accessorizeTasks = [
        { min: 1, max: 1, task: new Task("None ($0)", "", "No Accessories", new Outcome(accessorizeEarnings, Outcome.SET, 0)) },
        { min: 2, max: 2, task: new Task("Collar ($5)", "", "Wear a collar", new Outcome(accessorizeEarnings, Outcome.SET, 5)) },
        { min: 3, max: 3, task: new Task("Blindfold ($5)", "", "Wear a blindfold", new Outcome(accessorizeEarnings, Outcome.SET, 5)) },
        { min: 4, max: 4, task: new Task("Nipple Clamps ($10)", "", "Wear nipple clamps, remove or push away any clothing that block breasts.", new Outcome(accessorizeEarnings, Outcome.SET, 10)) },
        { min: 5, max: 5, task: new Task("Rope Chest Harness ($15)", "", "Bind your chest in a rope harness instead of clothing.", new Outcome(accessorizeEarnings, Outcome.SET, 15)) },
        { min: 6, max: 6, task: new Task("Gag / Plug ($15)", "", "Wear a mouth gag during anal tasks and a butt plug during oral tasks.", new Outcome(accessorizeEarnings, Outcome.SET, 15)) },
        { min: 7, max: 7, task: new Task("Handcuffs ($20)", "", "Bind your wrists behind your back during oral tasks.", new Outcome(accessorizeEarnings, Outcome.SET, 20)) },
        { min: 8, max: 8, task: new Task("Bare Chest Bundle ($20)", "", "Bind your chest in a rope harness instead of clothing, wear nipple clamps.", new Outcome(accessorizeEarnings, Outcome.SET, 20)) },
        { min: 9, max: 9, task: new Task("Control Bundle ($35)", "", "Wear a collar and blindfold. Wear a mouth gag during anal tasks and a butt plug during oral tasks. Bind your wrists behind your back during oral tasks.", new Outcome(accessorizeEarnings, Outcome.SET, 35)) },
        { min: 10, max: 10, task: new Task("Full Experience Bundle ($50)", "", "Wear a collar and blindfold. Wear a mouth gag during anal tasks and a butt plug during oral tasks. Bind your wrists behind your back during oral tasks. Bind your chest in a rope harness instead of clothing, wear nipple clamps.", new Outcome(accessorizeEarnings, Outcome.SET, 50)) },
    ]

    // Kinks
    var kink = new Event("Client Kinks", "", 10, true);
    var kinkEarnings = new Variable("Kink Earnings", Variable.NUM, 0);
    var kinkTasks = [
        { min: 1, max: 2, task: new Task("Sadist ($10)", "", "The client flogs you 20 times on each butt cheek.", new Outcome(kinkEarnings, Outcome.SET, 10)) },
        { min: 3, max: 4, task: new Task("A2M Lover ($10)", "", "The client will force you to do 10 deepthroats after anal.", new Outcome(kinkEarnings, Outcome.SET, 10)) },
        { min: 5, max: 5, task: new Task("Gape Artist ($10)", "", "The client will force you gape your asshole with two fingers of each hand, spreading as wide as you can for 30 seconds.", new Outcome(kinkEarnings, Outcome.SET, 10)) },
        { min: 6, max: 7, task: new Task("Degrader ($15)", "", "The client forces you to write \"WHORE\" on your face with lipstick (using your mouth as the 'O').", new Outcome(kinkEarnings, Outcome.SET, 15)) },
        { min: 8, max: 8, task: new Task("Beneficiary ($40)", "", "The client will give you a $40 tip!", new Outcome(kinkEarnings, Outcome.SET, 40)) },
        { min: 9, max: 10, task: new Task("Intense ($40)", "", "The client is particularly horny and intense. All rolls will now range from 2 to 10.", new Outcome(kinkEarnings, Outcome.SET, 40)) },

    ]

    var Blowjob = new Event("Client Kinks", "", 9, true);
    var blowjobEarnings = new Variable("Blowjob Earnings", Variable.NUM, 0);
    var blowjobTasks = [
        { min: 1, max: 1, task: new Task("Kissing and Licking ($10)", "", "", new Outcome(blowjobEarnings, Outcome.SET, 10)) },
        { min: 2, max: 3, task: new Task("Slow and Shallow ($15)", "", "", new Outcome(blowjobEarnings, Outcome.SET, 15)) },
        { min: 4, max: 5, task: new Task("Fast and Shallow ($25)", "", "", new Outcome(blowjobEarnings, Outcome.SET, 25)) },
        { min: 6, max: 7, task: new Task("Slow and Deep ($30)", "", "Dildo should hit (but not enter) your throat.", new Outcome(blowjobEarnings, Outcome.SET, 30)) },
        { min: 8, max: 9, task: new Task("Fast and Deep ($30)", "", "Dildo should hit (but not enter) your throat.", new Outcome(blowjobEarnings, Outcome.SET, 40)) },
        { min: 8, max: 9, task: new Task("Fast and Deep ($30)", "", "Dildo should hit (but not enter) your throat.", new Outcome(blowjobEarnings, Outcome.SET, 40)) },
    ]

    var Deepthroat = new Event("Deepthroat", "", 10, true);
    var deepthroatEarnings = new Variable("Deepthroat Earnings", Variable.NUM, 0);
    var deepthroatTasks = [
        { min: 1, max: 1, task: new Task("10 Deepthroats ($5)", "", "All the way balls deep.", new Outcome(deepthroatEarnings, Outcome.SET, 5)) },
        { min: 2, max: 2, task: new Task("20 Deepthroats ($10)", "", "All the way balls deep.", new Outcome(deepthroatEarnings, Outcome.SET, 10)) },
        { min: 3, max: 3, task: new Task("30 Deepthroats ($15)", "", "All the way balls deep.", new Outcome(deepthroatEarnings, Outcome.SET, 15)) },
        { min: 4, max: 4, task: new Task("40 Deepthroats ($20)", "", "All the way balls deep.", new Outcome(deepthroatEarnings, Outcome.SET, 20)) },
        { min: 5, max: 5, task: new Task("10 Short Throat Massages ($20)", "", "Hold balls deep for 3 seconds, go back and forth slightly during.", new Outcome(deepthroatEarnings, Outcome.SET, 20)) },
        { min: 6, max: 6, task: new Task("10 Long Throat Massages ($30)", "", "Hold balls deep for 6 seconds, go back and forth slightly during.", new Outcome(deepthroatEarnings, Outcome.SET, 30)) },
        { min: 7, max: 7, task: new Task("20 Short Throat Massages ($30)", "", "Hold balls deep for 3 seconds, go back and forth slightly during.", new Outcome(deepthroatEarnings, Outcome.SET, 30)) },
        { min: 8, max: 8, task: new Task("20 Long Throat Massages ($40)", "", "Hold balls deep for 6 seconds, go back and forth slightly during.", new Outcome(deepthroatEarnings, Outcome.SET, 40)) },
        { min: 9, max: 9, task: new Task("30s Throatfuck ($50)", "", "Fuck your throat for 30 seconds.", new Outcome(deepthroatEarnings, Outcome.SET, 50)) },
        { min: 10, max: 10, task: new Task("60s Throatfuck ($50)", "", "Fuck your throat for 60 seconds.", new Outcome(deepthroatEarnings, Outcome.SET, 75)) },
    ]

    var penetration = new Event("Penetration", "", 8, true);
    var penetrationEarnings = new Variable("Penetration Earnings", Variable.NUM, 0);
    var penetrationTasks = [
        { min: 1, max: 2, task: new Task("Slow and Shallow ($30)", "", "", new Outcome(penetrationEarnings, Outcome.SET, 30)) },
        { min: 3, max: 4, task: new Task("Slow and Deep ($40)", "", "", new Outcome(penetrationEarnings, Outcome.SET, 40)) },
        { min: 5, max: 6, task: new Task("Fast and Shallow ($50)", "", "", new Outcome(penetrationEarnings, Outcome.SET, 50)) },
        { min: 7, max: 8, task: new Task("Fast and Deep ($70)", "", "", new Outcome(penetrationEarnings, Outcome.SET, 70)) },,
    ]

    var cumshot = new Event("Cumshot", "", 4, false);
    var cumshotEarnings = new Variable("Cumshot Earnings", Variable.NUM, 20);
    var cumshotTasks = [
        {min: 1, max: 1, task: new Task("Breasts", "", "The client cums on your breasts.")},
        {min: 2, max: 2, task: new Task("Face", "", "The client cums on your face.")},
        {min: 3, max: 3, task: new Task("Mouth", "", "The client cums in your mouth.")},
        {min: 4, max: 4, task: new Task("Throat", "", "The client cums deep in your throat.")},
    ]

    var slave = new Event("Slave", "", 9, true);
    var slaveTasks = [
        {min: 1, max: 1, task: new Task("Nothing", "", "Your pimp has decided to be gracious")},
        {min: 2, max: 2, task: new Task("Sissy Hypno", "", "Your pimp forces you to watch Sissy Hypno for 1 hour.")},
        {min: 3, max: 3, task: new Task("Butt Plug", "", "Your pimp forces you to wear a butt plug for 4 hours.")},
        {min: 4, max: 4, task: new Task("Plugged Sleep", "", "Your pimp forces you to sleep the night with a butt plug.")},
        {min: 5, max: 5, task: new Task("Flogging", "", "Your pimp flogs you 50 times on each butt cheek.")},
        {min: 6, max: 6, task: new Task("Nipple Clamps", "", "Your pimp forces you to wear nipple clamps with weights for 30 minutes.")},
        {min: 7, max: 7, task: new Task("Gagged", "", "Your pimp forces you to wear a mouth gag for 30 minutes.")},
        {min: 8, max: 9, task: new Task("Bondage", "", "Your pimp binds you in a frogtie for 30 minutes.")},
    ]

    return new IFRState(ifr)
}

export function STL() {
    const ifr = new IFR("Sissy Transformation Lab")

    // Stages
    var body = new Stage("Body", "", "", 1, 2);
    var mind = new Stage("Mind", "", "", 1, 1);
    var training = new Stage("Training", "", "", 1, 1);
    var quality = new Stage("Quality Check", "", "", 1, 1);
    var ending = new Stage("Ending", "", "", 1, 1)

    // Events
    var eventGroup = new EventGroup("", 1, 2);
    var event1 = new Event("Body Transformation", "yeet treat", 10, true)
    var event2 = new Event("Pussy Table", "Roll a pussy", 8, true)
    var event3 = new Event("Yeet Treat", "", 8, true)

    // Variables
    var variable1 = new Variable("Breasts", Variable.STRING, "")
    var variable2 = new Variable("Genitals", Variable.STRING, "")
    variable1.addBounds(["", "Small", "Medium", "Large"])
    variable2.addBounds(["", "Oversized Clitoris", "Vagina", "Full Female"])
    ifr.addVariable(variable1)
    ifr.addVariable(variable2)

    // Tasks
    var outcome1 = new Outcome(variable1, Outcome.SET, "Small")
    var outcome2 = new Outcome(variable2, Outcome.SET, "Vagina")
    var outcome3 = new Outcome(variable2, Outcome.SET, "Oversized Clitoris")
    var task1 = new Task("Breasts", "", "Immobilize your body on a chair. Use nipple suckers to pump them for 5 minutes. Put on warm lube and repeat 1 more minute.", outcome1)
    var task2 = new Task("Reproductive System Transformation", "", "Wear a chastity cage and put on abundant numbing cream on your clitty", outcome2)
    var task3 = new Task("Irritable Pussy", "", "Permanent: You must always use a drop of hot sauce during penetration.", outcome3)


    event1.addTask({ min: 1, max: 5, task: task1 })
    event1.addTask({ min: 6, max: 10, task: task2 })
    event2.addTask({ min: 1, max: 1, task: task3 })

    // Dependencies
    event2.addDependency(event1)
    var condition1 = new Condition(variable2, Condition.ANY, ["Vagina", "Full Female"])
    event2.addDependency(condition1)


    eventGroup.addEvent(event1)
    eventGroup.addEvent(event2)
    body.addEventSpace(eventGroup)

    body.addProgression("Default", mind)
    ifr.addStage(body)
    ifr.addStage(mind)
    ifr.addStage(training)
    ifr.addStage(quality)
    ifr.addStage(ending)

    const ifrState = new IFRState(ifr)
    return ifrState
}

export function Simple() {
    const ifr = new IFR("Messy Facial", "https://www.faproulette.co/44693/messy-facial-roulette/", "https://files.faproulette.co/images/fap/44693.png?1672076552")
    var facial = new Stage("Facial", "Legs above head!", "", 6, 6)
    var test = new Variable("X", Variable.NUM, 4)
    ifr.addVariable(test)

    var prep = new Event("Preparation", "", 10);
    var edge = new Task("Edge", "", "Edge {{ _roll * 2 }} times before cumming");
    prep.addTask({ min: 1, max: 10, task: edge });
    facial.addEventSpace(prep);

    var orgasm = new Event("Orgasm", "", 2);
    var normal = new Task("Normal", "", "Cum normally");
    var ruined = new Task("Ruined", "", "Ruined orgasm");
    orgasm.addTask({ min: 1, max: 1, task: normal });
    orgasm.addTask({ min: 2, max: 2, task: ruined });
    orgasm.addDependency(prep);
    facial.addEventSpace(orgasm)

    var mouth = new Event("Mouth", "", 2);
    var opened = new Task("Opened", "", "Mouth wide open");
    var closed = new Task("Closed", "", "Mouth closed");
    mouth.addTask({ min: 1, max: 1, task: opened });
    mouth.addTask({ min: 2, max: 2, task: closed });
    mouth.addDependency(orgasm)
    facial.addEventSpace(mouth)

    var aim = new Event("Where to Aim", "", 10);
    var chin = new Task("Chin and Neck", "", "Aim for Chin and Neck");
    var forehead = new Task("Forehead and Nose", "", "Aim for Forehead and Nose");
    var cheeks = new Task("Mouth and Cheeks", "", "Aim for Mouth and Cheeks");
    var mouth_only = new Task("Mouth Only", "", "Aim directly in your Mouth");
    aim.addTask({ min: 1, max: 3, task: chin });
    aim.addTask({ min: 4, max: 6, task: forehead });
    aim.addTask({ min: 7, max: 9, task: cheeks });
    aim.addTask({ min: 10, max: 10, task: mouth_only });
    aim.addDependency(mouth)
    facial.addEventSpace(aim)

    var gather = new Event("Gathering Cum", "", 10);
    var scrape = new Task("Scrape into Mouth", "", "Scrape all cum into your mouth");
    var rub = new Task("Rub on Face", "", "Rub cum all over face, lick fingers cleans");
    var lick = new Task("Lick lips", "", "Lick up any cum your tongue can reach, leave the rest as is");
    gather.addTask({ min: 1, max: 8, task: scrape });
    gather.addTask({ min: 9, max: 9, task: rub });
    gather.addTask({ min: 10, max: 10, task: lick });
    gather.addDependency(aim)
    facial.addEventSpace(gather);

    var play = new Event("Cumplay", "", 10);
    var snowball = new Task("Snowball", "", "Snowball X times");
    var swirl = new Task("Swirl", "", "Swirl cum around in mouth for X * 10 seconds");
    var gargle = new Task("Gargle", "", "Gargle cum for X * 10 seconds");
    var smear = new Task("Smear", "", "Smear around face, then collect with fingers. Repeat X  times.");
    var drool = new Task("Drool", "", "Drool onto body, scoop with hands and lick them clean.");
    var hold = new Task("Hold", "", "Hold cum in mouth for {{ X }} minutes then reroll.", "REROLL");
    play.addTask({ min: 1, max: 2, task: snowball })
    play.addTask({ min: 3, max: 4, task: swirl })
    play.addTask({ min: 5, max: 6, task: gargle })
    play.addTask({ min: 7, max: 7, task: smear })
    play.addTask({ min: 8, max: 8, task: drool })
    play.addTask({ min: 9, max: 10, task: hold });
    play.addDependency(gather)
    facial.addEventSpace(play)

    ifr.addStage(facial);

    return new IFRState(ifr);
}

