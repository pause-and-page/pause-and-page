package com.pauseandpage.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Restores reminders after a restart or app update. */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        ReminderScheduler.scheduleAll(context);
    }
}
