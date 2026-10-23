using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// Позволяет серверу автоматически открывать wwwroot/index.html при входе на сайт
app.UseDefaultFiles();
app.UseStaticFiles();

// Хранилище данных в памяти приложения (In-Memory коллекция)
var items = new List<GameItem>
{
    new(1, "Minecraft", 2011, "Sandbox"),
    new(2, "Cyberpunk 2077", 2020, "RPG"),
    new(3, "The Witcher 3: Wild Hunt", 2015, "RPG"),
    new(4, "DOOM Eternal", 2020, "Shooter"),
    new(5, "Baldur's Gate 3", 2023, "RPG")
};

var nextId = 6;

// 1. GET /api/items — Получение всех элементов (с поддержкой поиска и фильтрации через LINQ)
app.MapGet("/api/items", async ([FromQuery] string? search, [FromQuery] string? genre) =>
{
    await Task.Delay(10); // Демонстрация работы async/await
    
    IEnumerable<GameItem> query = items;

    // Использование LINQ для фильтрации
    if (!string.IsNullOrWhiteSpace(search))
    {
        query = query.Where(item => item.Title.Contains(search, StringComparison.OrdinalIgnoreCase));
    }

    if (!string.IsNullOrWhiteSpace(genre) && genre != "All")
    {
        query = query.Where(item => item.Genre.Equals(genre, StringComparison.OrdinalIgnoreCase));
    }

    return Results.Ok(query.OrderByDescending(item => item.Year).ToList());
});

// 2. GET /api/items/{id} — Получение одного элемента по ID
app.MapGet("/api/items/{id:int}", async (int id) =>
{
    await Task.Delay(5);
    var foundItem = items.FirstOrDefault(item => item.Id == id);

    // Использование Pattern Matching + Switch Expression
    return foundItem switch
    {
        not null => Results.Ok(foundItem),
        null => Results.NotFound(new { message = $"Игра с ID {id} не найдена." })
    };
});

// 3. POST /api/items — Добавление нового элемента
app.MapPost("/api/items", async (GameItemDto dto) =>
{
    await Task.Delay(10);

    // Pattern Matching для валидации входных данных
    if (dto is { Title.Length: 0 } or { Year: < 1970 or > 2035 })
    {
        return Results.BadRequest(new { message = "Некорректное название или год выпуска (1970–2035)." });
    }

    var newItem = new GameItem(nextId++, dto.Title.Trim(), dto.Year, dto.Genre.Trim());
    items.Add(newItem);

    return Results.Created($"/api/items/{newItem.Id}", newItem);
});

// 4. PUT /api/items/{id} — Обновление существующего элемента
app.MapPut("/api/items/{id:int}", async (int id, GameItemDto dto) =>
{
    await Task.Delay(10);

    var index = items.FindIndex(item => item.Id == id);
    if (index is -1)
    {
        return Results.NotFound(new { message = $"Игра с ID {id} не найдена." });
    }

    // Использование ключевого слова 'with' для неизменяемых записей (record)
    var updatedItem = items[index] with
    {
        Title = dto.Title.Trim(),
        Year = dto.Year,
        Genre = dto.Genre.Trim()
    };

    items[index] = updatedItem;
    return Results.Ok(updatedItem);
});

// 5. DELETE /api/items/{id} — Удаление элемента
app.MapDelete("/api/items/{id:int}", async (int id) =>
{
    await Task.Delay(10);

    var existingItem = items.FirstOrDefault(item => item.Id == id);
    if (existingItem is null)
    {
        return Results.NotFound(new { message = $"Игра с ID {id} не найдена." });
    }

    items.Remove(existingItem);
    return Results.NoContent();
});

app.Run();

// Современный C#: использование record для моделей данных
public record GameItem(int Id, string Title, int Year, string Genre);
public record GameItemDto(string Title, int Year, string Genre);