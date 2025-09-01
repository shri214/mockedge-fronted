import { createSlice, type PayloadAction } from "@reduxjs/toolkit";


interface CollapseState {
  isCollapsed: boolean;     
}

const initialState: CollapseState = {
  isCollapsed: false,
};  
export const collapseSlice = createSlice({
  name: "collapse", 
    initialState,
    reducers: {
        toggleCollapse: (state) => {
            state.isCollapsed = !state.isCollapsed;
        },
        setCollapse: (state, action: PayloadAction<{ isCollapsed: boolean }>) => {
            console.log(action.payload)
            state.isCollapsed = action.payload.isCollapsed;
        },
    },
});
export const { toggleCollapse, setCollapse } = collapseSlice.actions;
export const collapseReducer = collapseSlice.reducer;