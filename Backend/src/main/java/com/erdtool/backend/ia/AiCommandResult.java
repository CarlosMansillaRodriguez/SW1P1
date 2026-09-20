package com.erdtool.backend.ia;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter @Setter
public class AiCommandResult {
    private String reply;
    private List<UUID> affectedEntityIds = new ArrayList<>();
    private List<UUID> deletedEntityIds = new ArrayList<>();
    private boolean relationshipsChanged;
}