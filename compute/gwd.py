import numpy as np
import matplotlib.pyplot as plt

def kills_per_hour(TTK, T_reset, N=np.inf):
    """Kill/hr model with room resetting."""
    term1 = (TTK + 90) * (1 - 4 / N)
    term2 = (TTK + T_reset) * (4 / N)
    return 3600 / (term1 + term2)

def adjusted_kills_per_hour(kph, N_trip, T_prep):
    """Adjust kill/hr for trip duration and prep time."""
    T_boss = N_trip * 3600 /  kph
    return (T_boss / (T_boss + T_prep)) * kph

def run_analysis(TTK, T_reset, N_values, N_trip, T_prep):
    print(f"Analysis with TTK = {TTK}, T_reset = {T_reset}, N_trip = {N_trip}, T_prep = {T_prep}")
    print("-" * 60)
    for N in N_values:
        kph = kills_per_hour(TTK, T_reset, N)
        kph_adj = adjusted_kills_per_hour(kph, N_trip, T_prep)
        print(f"N = {N:>4}: Raw = {kph:.2f} | Adjusted = {kph_adj:.2f} kills/hour")

    # N = infinity case
    kph_inf = kills_per_hour(TTK, T_reset, np.inf)
    kph_inf_adj = adjusted_kills_per_hour(kph_inf, N_trip, T_prep)
    print(f"N =  ∞  : Raw = {kph_inf:.2f} | Adjusted = {kph_inf_adj:.2f} kills/hour")

# Example usage
# TTK = 57.1
# T_reset = 10
# N_trip = 20      # Boss kills per trip

# N_values = np.array([40, 35, 30, np.inf])
# N_trip = np.arange(10,21)
# T_traverse = 77*0.6 # ticks times num ticks [s]

# for N in N_values:
#     TTK_goblins = 40*3.8
#     if not np.isinf(N):
#         TTK_goblins = N*3.8
#     T_prep = T_traverse + TTK_goblins
#     kph = adjusted_kills_per_hour(
#         kills_per_hour(TTK, T_reset,N),
#         N_trip,
#         T_prep
#     )
#     plt.plot(N_trip, kph, label=f"N={N}")



# T_prep = np.arange()

# kph = adjusted_kills_per_hour(
#     kills_per_hour(TTK, T_reset, 30),
#     N_trip,
#     T_prep
# )

# plt.xlabel("# of kills per trip")
# plt.ylabel("kph")
# plt.legend()
# plt.show()


def preptime_triplength_visualization():
    TTK = 57.1  # avg time to kill Graardor [s]
    T_reset = (10 + 8) * 0.6
    N_kc = 40
    kph_base = kills_per_hour(TTK, T_reset, N_kc)

    # Create 2D grid
    trip_lengths = np.arange(10, 31)                   # x-axis
    T_prep_multipliers = np.linspace(0.5, 1.5, 100)    # y-axis
    T_prep_mean = 365 * 0.6
    T_preps = T_prep_mean * T_prep_multipliers

    TL_grid, TP_grid = np.meshgrid(trip_lengths, T_preps)
    KPH_grid = adjusted_kills_per_hour(kph_base, TL_grid, TP_grid)

    plt.figure(figsize=(10, 6))
    contour = plt.contourf(TL_grid, TP_grid, KPH_grid, levels=20, cmap="viridis")
    cbar = plt.colorbar(contour)
    cbar.set_label("Adjusted kills per hour")

    plt.xlabel("Trip length (boss kills)")
    plt.ylabel("Prep time (seconds)")
    plt.title("Adjusted KPH vs Trip Length and Prep Time")
    plt.grid(True, linestyle="--", alpha=0.4)
    plt.tight_layout()
    plt.show()


def preptime_triplength_heatmap():
    TTK = 57.1
    T_reset = (10 + 8) * 0.6
    N_kc = 40
    kph_base = kills_per_hour(TTK, T_reset, N_kc)

    trip_lengths = np.arange(10, 31)  # x-axis
    T_prep_factors = np.linspace(0.5, 1.5, 21)  # y-axis, 21 rows
    T_prep_mean = 365 * 0.6
    T_preps = T_prep_mean * T_prep_factors

    heatmap = np.zeros((len(T_preps), len(trip_lengths)))
    for i, T_prep in enumerate(T_preps):
        for j, N_trip in enumerate(trip_lengths):
            heatmap[i, j] = adjusted_kills_per_hour(kph_base, N_trip, T_prep)

    plt.figure(figsize=(10, 6))
    im = plt.imshow(heatmap, aspect="auto", origin="lower",
                    extent=[trip_lengths[0], trip_lengths[-1],
                            T_preps[0], T_preps[-1]],
                    cmap="viridis")
    plt.colorbar(im, label="Adjusted kills per hour")
    plt.xlabel("Trip length (boss kills)")
    plt.ylabel("Prep time (seconds)")
    plt.title("Adjusted KPH Heatmap: Trip Length vs Prep Time")
    plt.tight_layout()
    plt.show()


def preptime_triplength_20():
    TTK = 57.1
    T_reset = (10 + 8) * 0.6
    N_kc = 40
    kph_base = kills_per_hour(TTK, T_reset, N_kc)
    trip_lengths = np.arange(10, 31)  # x-axis
    T_prep_factors = np.linspace(0.5, 1.5, 21)  # y-axis, 21 rows
    T_prep_mean = 365 * 0.6
    T_preps = T_prep_mean * T_prep_factors
    kphs = adjusted_kills_per_hour(kph_base, 20, T_preps)
    plt.plot(T_preps, kphs)
    plt.xlabel("prep length [s]")
    plt.ylabel("kph")
    plt.show()



import numpy as np
import matplotlib.pyplot as plt

def plot_kph_vector_field():
    TTK = 57.1
    T_reset = (10 + 8) * 0.6
    N_kc = 40
    kph_base = kills_per_hour(TTK, T_reset, N_kc)

    trip_lengths = np.arange(10, 31)  # x-axis
    T_prep_factors = np.linspace(0.5, 1.5, 21)  # y-axis, 21 rows
    T_prep_mean = 365 * 0.6
    T_preps = T_prep_mean * T_prep_factors

    # Compute scalar field (adjusted KPH)
    heatmap = np.zeros((len(T_preps), len(trip_lengths)))
    for i, T_prep in enumerate(T_preps):
        for j, N_trip in enumerate(trip_lengths):
            heatmap[i, j] = adjusted_kills_per_hour(kph_base, N_trip, T_prep)

    # Compute gradient (partial derivatives)
    df_dy, df_dx = np.gradient(heatmap, T_preps, trip_lengths)  # rows, cols → dy, dx

    # Build meshgrid for coordinates
    X, Y = np.meshgrid(trip_lengths, T_preps)

    # Plot scalar field background
    plt.figure(figsize=(10, 6))
    plt.contourf(X, Y, heatmap, levels=20, cmap="viridis")
    plt.colorbar(label="Adjusted kills per hour")

    # Overlay gradient vectors
    plt.quiver(X, Y, df_dx, df_dy, color="white", scale=300)
    
    plt.xlabel("Trip length (boss kills)")
    plt.ylabel("Prep time (seconds)")
    plt.title("Vector Field: ∇(Adjusted KPH)")
    plt.grid(True, linestyle="--", alpha=0.4)
    plt.tight_layout()
    plt.show()



def expected_hours_per_drop_visualization():
    TTK = 57.1  # avg time to kill Graardor [s]
    T_reset = (10 + 8) * 0.6
    N_kc = 40
    kph_base = kills_per_hour(TTK, T_reset, N_kc)

    # Grid setup
    trip_lengths = np.arange(10, 31)                   # x-axis
    T_prep_multipliers = np.linspace(0.5, 1.5, 100)    # y-axis
    T_prep_mean = 365 * 0.6
    T_preps = T_prep_mean * T_prep_multipliers

    TL_grid, TP_grid = np.meshgrid(trip_lengths, T_preps)
    KPH_grid = adjusted_kills_per_hour(kph_base, TL_grid, TP_grid)

    # Expected time to drop in hours
    drop_rate = 1 / 508
    hours_per_drop = 1 / (drop_rate * KPH_grid)  # same as 508 / kph

    plt.figure(figsize=(10, 6))
    contour = plt.contourf(TL_grid, TP_grid, hours_per_drop, levels=20, cmap="plasma")
    cbar = plt.colorbar(contour)
    cbar.set_label("Expected hours per 1/508 drop")

    plt.xlabel("Trip length (boss kills)")
    plt.ylabel("Prep time (seconds)")
    plt.title("Expected Hours per Drop vs Trip Length and Prep Time")
    plt.grid(True, linestyle="--", alpha=0.4)
    plt.tight_layout()
    plt.show()




if __name__ == "__main__":
    # preptime_triplength_heatmap()
    # print(264*0.6) # chins
    # print(305*0.6) # 30 kills
    # print(341*0.6) # barrage hopping
    # print(365*0.6)
    # preptime_triplength_20()
    # plot_kph_vector_field()
    # preptime_triplength_visualization()
    expected_hours_per_drop_visualization()

