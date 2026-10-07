package com.pauseandpage.app;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.Calendar;

/** Schedules and shows the optional morning and evening affirmation reminders. */
final class ReminderScheduler {
    static final String ACTION = "com.pauseandpage.app.REMINDER";
    private static final String CH_SOUND = "reminders";
    private static final String CH_QUIET = "reminders_quiet";

    private ReminderScheduler() {}

    static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences("pause_and_page_native", Context.MODE_PRIVATE);
    }

    static JSONObject config(Context c) {
        try {
            return new JSONObject(prefs(c).getString("config", "{}"));
        } catch (JSONException e) {
            return new JSONObject();
        }
    }

    static void scheduleAll(Context c) {
        JSONObject j = config(c);
        cancelAll(c);
        if (j.optBoolean("morning")) schedule(c, "morning", j.optString("mt", "07:30"));
        if (j.optBoolean("evening")) schedule(c, "evening", j.optString("et", "20:30"));
    }

    static void cancelAll(Context c) {
        AlarmManager am = c.getSystemService(AlarmManager.class);
        if (am == null) return;
        am.cancel(alarmIntent(c, "morning"));
        am.cancel(alarmIntent(c, "evening"));
    }

    private static PendingIntent alarmIntent(Context c, String kind) {
        Intent i = new Intent(c, ReminderReceiver.class).setAction(ACTION).putExtra("kind", kind);
        return PendingIntent.getBroadcast(c, "morning".equals(kind) ? 1 : 2, i,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static void schedule(Context c, String kind, String hhmm) {
        boolean morning = "morning".equals(kind);
        int h = morning ? 7 : 20;
        int m = 30;
        try {
            String[] p = hhmm.split(":");
            h = Integer.parseInt(p[0].trim());
            m = Integer.parseInt(p[1].trim());
        } catch (RuntimeException ignored) {
            // keep defaults
        }
        Calendar at = Calendar.getInstance();
        at.set(Calendar.HOUR_OF_DAY, h);
        at.set(Calendar.MINUTE, m);
        at.set(Calendar.SECOND, 0);
        at.set(Calendar.MILLISECOND, 0);
        if (!at.after(Calendar.getInstance())) at.add(Calendar.DAY_OF_YEAR, 1);

        AlarmManager am = c.getSystemService(AlarmManager.class);
        if (am == null) return;
        // Inexact but battery-friendly and allowed in Doze; needs no exact-alarm permission.
        am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at.getTimeInMillis(), alarmIntent(c, kind));
    }

    static void show(Context c, String kind) {
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        if (nm == null) return;
        JSONObject j = config(c);
        ensureChannels(nm);

        boolean morning = "morning".equals(kind);
        boolean showText = "show".equals(j.optString("lock", "private"));
        String channel = j.optBoolean("sound", true) ? CH_SOUND : CH_QUIET;
        String fallback = morning ? "One manageable step is enough to begin." : "You can leave unfinished things for tomorrow.";
        String text = pick(j.optJSONArray(morning ? "morningTexts" : "eveningTexts"), fallback);

        Intent open = new Intent(c, MainActivity.class)
                .setData(Uri.parse("pauseandpage://affirmation?kind=" + kind))
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent tap = PendingIntent.getActivity(c, morning ? 11 : 12, open,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Notification.Builder b = new Notification.Builder(c, channel)
                .setSmallIcon(R.drawable.ic_stat_pause)
                .setColor(morning ? 0xFF7A5E00 : 0xFF5E48B0)
                .setAutoCancel(true)
                .setContentIntent(tap)
                .setCategory(Notification.CATEGORY_REMINDER);

        if (showText) {
            b.setContentTitle(morning ? "\u2600 Good morning" : "\u263E Evening pause")
                    .setContentText(text)
                    .setStyle(new Notification.BigTextStyle().bigText(text))
                    .setVisibility(Notification.VISIBILITY_PUBLIC);
        } else {
            // Private mode: generic wording everywhere, so nothing personal shows on the lock screen.
            b.setContentTitle("Pause and Page")
                    .setContentText("A moment for you is ready.")
                    .setVisibility(Notification.VISIBILITY_PRIVATE);
        }
        try {
            nm.notify(morning ? 101 : 102, b.build());
        } catch (SecurityException ignored) {
            // Notifications not permitted; nothing to do.
        }
    }

    private static String pick(JSONArray arr, String fallback) {
        if (arr == null || arr.length() == 0) return fallback;
        int day = Calendar.getInstance().get(Calendar.DAY_OF_YEAR);
        String s = arr.optString(day % arr.length(), fallback);
        return s.isEmpty() ? fallback : s;
    }

    private static void ensureChannels(NotificationManager nm) {
        NotificationChannel sound = new NotificationChannel(CH_SOUND, "Morning and evening reminders", NotificationManager.IMPORTANCE_DEFAULT);
        sound.setDescription("Optional affirmation reminders you set in Pause and Page.");
        NotificationChannel quiet = new NotificationChannel(CH_QUIET, "Silent reminders", NotificationManager.IMPORTANCE_LOW);
        quiet.setDescription("The same reminders, without sound.");
        nm.createNotificationChannel(sound);
        nm.createNotificationChannel(quiet);
    }
}
