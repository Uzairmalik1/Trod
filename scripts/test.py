try:
    from clipsai import resize as clipsai_resize
    print("clipsai_resize imported successfully!")
except ImportError as e:
    print("ImportError:", e)
