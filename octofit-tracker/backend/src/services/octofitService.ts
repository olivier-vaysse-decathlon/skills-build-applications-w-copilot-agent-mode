import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) {
    throw Object.assign(new Error('Activity must be an object'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input;
  if (
    typeof userId !== 'string' ||
    !mongoose.isObjectIdOrHexString(userId) ||
    typeof teamId !== 'string' ||
    !mongoose.isObjectIdOrHexString(teamId) ||
    typeof type !== 'string' ||
    type.trim().length === 0 ||
    typeof minutes !== 'number' ||
    !Number.isFinite(minutes) ||
    minutes <= 0
  ) {
    throw Object.assign(new Error('Activity fields are invalid'), { status: 400 });
  }

  const [user, team] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);
  if (!user || !team) {
    throw Object.assign(new Error('Activity user or team was not found'), { status: 404 });
  }

  return Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) {
    throw Object.assign(new Error('Team must be an object'), { status: 400 });
  }

  const { name, mascot, members = [] } = input;
  if (
    typeof name !== 'string' ||
    name.trim().length === 0 ||
    typeof mascot !== 'string' ||
    mascot.trim().length === 0 ||
    !Array.isArray(members) ||
    !members.every((member) => typeof member === 'string' && mongoose.isObjectIdOrHexString(member))
  ) {
    throw Object.assign(new Error('Team fields are invalid'), { status: 400 });
  }

  const memberIds = [...new Set(members)];
  if (memberIds.length > 0 && await User.countDocuments({ _id: { $in: memberIds } }) !== memberIds.length) {
    throw Object.assign(new Error('One or more team members were not found'), { status: 404 });
  }

  return Team.create({ name, mascot, members: memberIds });
}

export async function getLeaderboard() {
  const teams = await Team.aggregate<{ teamName: string; totalPoints: number }>([
    {
      $lookup: {
        from: Activity.collection.name,
        localField: '_id',
        foreignField: 'team',
        as: 'activities',
      },
    },
    {
      $project: {
        _id: 0,
        teamName: '$name',
        totalPoints: { $sum: '$activities.points' },
      },
    },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);

  return teams.map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User was not found'), { status: 404 });
  }

  const recentActivities = await Activity.find({ user: user._id })
    .sort({ occurredAt: -1 })
    .limit(10)
    .lean();
  const focusReasons = new Map<string, string>();
  const goalFocus = user.fitnessGoal.trim().toLowerCase();
  focusReasons.set(goalFocus, `Matches your ${user.fitnessGoal} fitness goal.`);
  for (const activity of recentActivities) {
    const activityFocus = activity.type.trim().toLowerCase();
    if (!focusReasons.has(activityFocus)) {
      focusReasons.set(activityFocus, `Based on your recent ${activity.type} activity.`);
    }
  }

  const focusOrder = [...focusReasons.keys()];
  const suggestions = (await Workout.find().lean())
    .flatMap((workout) => {
      const focus = workout.focus.trim().toLowerCase();
      const reason = focusReasons.get(focus);
      return reason ? [{ ...workout, reason }] : [];
    })
    .sort((left, right) =>
      focusOrder.indexOf(left.focus.trim().toLowerCase()) -
      focusOrder.indexOf(right.focus.trim().toLowerCase()),
    );

  return suggestions;
}

export { User };
