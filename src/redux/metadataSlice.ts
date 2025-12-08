import { createEntityAdapter, createSlice, EntityState, nanoid, PayloadAction } from "@reduxjs/toolkit";
import { client } from "../util/client";

import { httpRequestState } from "../types";
import { settings } from "../config";
import { createAppAsyncThunk } from "./createAsyncThunkWithTypes";
import { RootState } from "./store";

export interface Catalog {
  id: string      // generated
  fieldIds: string[];      // references into `fields` adapter

  flavor: string, // "dublincore/episode"
  title: string,  // name identifier
}

interface BackendCatalog {
  fields: MetadataField[],
  flavor: string, // "dublincore/episode"
  title: string,  // name identifier
}

export interface MetadataField {
  id: string;              // `${catalogId}:${fieldName}`
  catalogId: string;
  name: string;            // original `id`

  readOnly: boolean,
  label: string;
  type: string;
  value: string,
  required: boolean,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  collection: { [key: string]: any } | undefined,
}

interface metadata {
  catalogs: EntityState<Catalog, string>,
  fields: EntityState<MetadataField, string>,
  hasChanges: boolean;         // Did user make changes to metadata view since last save
}

const catalogsAdapter = createEntityAdapter<Catalog>();
const fieldsAdapter = createEntityAdapter<MetadataField>();

const initialState: metadata & httpRequestState = {
  catalogs: catalogsAdapter.getInitialState(),
  fields: fieldsAdapter.getInitialState(),
  hasChanges: false,
  status: "idle",
  error: undefined,
  errorReason: "unknown",
};

export const fetchMetadata = createAppAsyncThunk("metadata/fetchMetadata", async () => {
  if (!settings.id) {
    throw new Error("Missing media package identifier");
  }

  const response = await client.get(`${settings.opencast.url}/editor/${settings.id}/metadata.json`);
  return JSON.parse(response) as BackendCatalog[];
});

/**
 * Slice for managing a post request for saving current changes and starting a workflow
 */
const metadataSlice = createSlice({
  name: "metadataState",
  initialState,
  reducers: {
    setFieldValue: (state, action: PayloadAction<{ id: string; value: string }>) => {
      fieldsAdapter.updateOne(state.fields, {
        id: action.payload.id,
        changes: { value: action.payload.value },
      });
      state.hasChanges = true;
    },
    setHasChanges: (state, action: PayloadAction<metadata["hasChanges"]>) => {
      state.hasChanges = action.payload;
    },
  },
  extraReducers: builder => {
    builder.addCase(
      fetchMetadata.pending, (state, _action) => {
        state.status = "loading";
      });
    builder.addCase(fetchMetadata.fulfilled, (state, action) => {
      // Entity Adapter preparations
      const catalogEntities: Catalog[] = [];
      const fieldEntities: MetadataField[] = [];

      action.payload.forEach(rawCatalog => {
        const catalogId = nanoid();                // new stable id
        const fieldIds: string[] = [];

        rawCatalog.fields.forEach(field => {
          const fieldId = `${catalogId}:${field.id}`; // unique per catalog
          fieldIds.push(fieldId);

          fieldEntities.push({
            ...field,
            id: fieldId,
            name: field.id,
            catalogId,         // back‑reference for convenience
          });
        });

        catalogEntities.push({
          ...rawCatalog,
          id: catalogId,
          fieldIds,
        });
      });

      // Replace state with the fetched entities
      catalogsAdapter.setAll(state.catalogs, catalogEntities);
      fieldsAdapter.setAll(state.fields, fieldEntities);
      state.hasChanges = false;
    });
    builder.addCase(
      fetchMetadata.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
  selectors: {
    selectHasChanges: state => state.hasChanges,
    selectGetStatus: state => state.status,
    selectGetError: state => state.error,
    selectTitleFromEpisodeDc: state => {
      for (const catalogId of state.catalogs.ids) {
        const catalog = state.catalogs.entities[catalogId];
        if (!catalog) { continue; }

        if (catalog.flavor === "dublincore/episode") {
          for (const fieldId of state.fields.ids) {
            const field = state.fields.entities[fieldId];
            if (field.catalogId === catalogId && field.name === "title") {
              return field.value;
            }
          }
        }
      }

      return undefined;
    },
  },
});

export const { setFieldValue, setHasChanges } = metadataSlice.actions;

export const {
  selectIds: selectCatalogIds,
  selectById: selectCatalogById,
} = catalogsAdapter.getSelectors<RootState>(s => s.metadataState.catalogs);

export const {
  selectById: selectFieldById,
} = fieldsAdapter.getSelectors<RootState>(s => s.metadataState.fields);

export const {
  selectHasChanges,
  selectGetStatus,
  selectGetError,
  selectTitleFromEpisodeDc,
} = metadataSlice.selectors;

export default metadataSlice.reducer;
