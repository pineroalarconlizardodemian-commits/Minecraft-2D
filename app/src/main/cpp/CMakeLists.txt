cmake_minimum_required(VERSION 3.18.1)
project("mc2d")

add_library(mc2d SHARED native_game.c)
target_link_libraries(mc2d android log GLESv3)
