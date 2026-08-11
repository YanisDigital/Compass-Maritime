// Release builds open no console window behind the application.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    compass_error_lib::run()
}
